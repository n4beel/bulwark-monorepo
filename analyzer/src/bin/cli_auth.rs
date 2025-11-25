//! CLI Authentication
//!
//! Implements browser-based OAuth flow for the CLI, similar to Firebase CLI.

use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader, Write};
use std::net::TcpListener;
use std::sync::mpsc;
use std::thread;
use tokio::time::{timeout, Duration};

use crate::cli_config::{CliConfig, UserConfig};
use crate::cli_display::{print_error, print_info, print_success, print_warning, Spinner};

const CLI_CALLBACK_PORT: u16 = 9875; // Port for local callback server
const AUTH_TIMEOUT_SECS: u64 = 300; // 5 minute timeout for auth flow

/// Response from /auth/{provider}/url endpoint
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthUrlResponse {
    pub auth_url: String,
}

/// Authentication response from backend
#[derive(Debug, Deserialize)]
pub struct AuthCallbackResponse {
    pub access_token: String,
    pub user: UserConfig,
}

/// Run the login flow
pub async fn login(provider: &str) -> Result<()> {
    let mut config = CliConfig::load()?;

    // Check if already logged in
    if config.user.is_some() {
        let user = config.user.as_ref().unwrap();
        print_warning(&format!(
            "Already logged in as {}. Use 'bulwark logout' to sign out first.",
            user.name
                .as_deref()
                .or(user.email.as_deref())
                .unwrap_or("Unknown User")
        ));
        return Ok(());
    }

    print_info(&format!("Starting {} authentication...", provider));

    // Start local callback server
    let (tx, rx) = mpsc::channel::<AuthCallbackResponse>();
    let callback_url = format!("http://localhost:{}/callback", CLI_CALLBACK_PORT);

    // Start the callback server in a separate thread
    let server_handle = thread::spawn(move || start_callback_server(tx));

    // First, get the OAuth URL from the backend
    let api_endpoint = format!(
        "{}/auth/{}/url?redirect_uri={}&cli_mode=true",
        config.api_url,
        provider.to_lowercase(),
        urlencoding::encode(&callback_url)
    );

    print_info("Fetching authentication URL...");

    // Call API to get the actual OAuth URL
    let client = reqwest::Client::new();
    let response = client
        .get(&api_endpoint)
        .header("Accept", "application/json")
        .send()
        .await
        .context("Failed to connect to Bulwark server")?;

    if !response.status().is_success() {
        return Err(anyhow!(
            "Failed to get auth URL: HTTP {}",
            response.status()
        ));
    }

    let auth_response: AuthUrlResponse = response
        .json()
        .await
        .context("Failed to parse auth URL response")?;

    let auth_url = auth_response.auth_url;

    // Open browser with the actual OAuth URL
    print_info("Opening browser for authentication...");
    if let Err(e) = open_browser(&auth_url) {
        print_error(&format!("Failed to open browser: {}", e));
        print_info(&format!("Please manually open this URL:\n{}", auth_url));
    }

    // Wait for callback with a spinner
    let mut spinner = Spinner::new("Waiting for authentication...");

    // Try to receive auth response with timeout
    match timeout(Duration::from_secs(AUTH_TIMEOUT_SECS), async {
        loop {
            if let Ok(response) = rx.try_recv() {
                return Ok::<_, anyhow::Error>(response);
            }
            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    })
    .await
    {
        Ok(Ok(auth_response)) => {
            spinner.success("Authenticated successfully!");

            // Save to config
            config.auth_token = Some(auth_response.access_token);
            config.user = Some(auth_response.user.clone());
            config.save()?;

            println!();
            print_success(&format!(
                "Welcome, {}!",
                auth_response
                    .user
                    .name
                    .as_deref()
                    .or(auth_response.user.email.as_deref())
                    .unwrap_or("User")
            ));

            if auth_response.user.whitelisted {
                print_success("You have whitelisted access to premium features.");
            }
        }
        Ok(Err(e)) => {
            spinner.fail(&format!("Authentication failed: {}", e));
        }
        Err(_) => {
            spinner.fail("Authentication timed out.");
            print_error("Please try again with 'bulwark login'.");
        }
    }

    // Stop the server thread
    drop(server_handle); // Server should exit after receiving callback

    Ok(())
}

/// Start a local HTTP server to receive OAuth callback
fn start_callback_server(tx: mpsc::Sender<AuthCallbackResponse>) -> Result<()> {
    let listener = TcpListener::bind(format!("127.0.0.1:{}", CLI_CALLBACK_PORT))
        .context("Failed to start callback server")?;

    // Set timeout so we don't block forever
    listener.set_nonblocking(false)?;

    for stream in listener.incoming() {
        match stream {
            Ok(mut stream) => {
                let mut reader = BufReader::new(&stream);
                let mut request_line = String::new();

                if reader.read_line(&mut request_line).is_err() {
                    continue;
                }

                // Parse the request to get query parameters
                if request_line.contains("GET /callback") {
                    // Extract query string from GET request
                    let query_start = request_line.find('?');
                    let query_end = request_line.find(" HTTP");

                    if let (Some(start), Some(end)) = (query_start, query_end) {
                        let query = &request_line[start + 1..end];

                        // Parse query parameters
                        let params: std::collections::HashMap<_, _> = query
                            .split('&')
                            .filter_map(|pair| {
                                let mut split = pair.split('=');
                                Some((
                                    split.next()?.to_string(),
                                    urlencoding::decode(split.next()?).ok()?.to_string(),
                                ))
                            })
                            .collect();

                        // Check for error
                        if let Some(error) = params.get("error") {
                            let error_msg = params
                                .get("error_description")
                                .map(|s| s.to_string())
                                .unwrap_or_else(|| error.clone());

                            send_html_response(&mut stream, false, &error_msg);
                            continue;
                        }

                        // Extract token and user info
                        if let Some(token) = params.get("token") {
                            let user_config = UserConfig {
                                id: params.get("user_id").cloned().unwrap_or_default(),
                                email: params.get("email").cloned(),
                                name: params.get("name").cloned(),
                                whitelisted: params
                                    .get("whitelisted")
                                    .map(|s| s == "true")
                                    .unwrap_or(false),
                            };

                            let response = AuthCallbackResponse {
                                access_token: token.clone(),
                                user: user_config,
                            };

                            // Send success response to browser
                            send_html_response(&mut stream, true, "");

                            // Send to main thread
                            let _ = tx.send(response);
                            break;
                        }
                    }
                }

                // Send generic response for other requests
                send_html_response(&mut stream, false, "Invalid callback request");
            }
            Err(_) => continue,
        }
    }

    Ok(())
}

/// Send HTML response to browser
fn send_html_response(stream: &mut std::net::TcpStream, success: bool, error_message: &str) {
    let error_msg = format!(
        "Authentication failed: {}. Please try again.",
        error_message
    );
    let (title, message, color) = if success {
        (
            "Authentication Successful",
            "You have been successfully authenticated! You can close this window and return to the CLI.",
            "#10B981" // Green
        )
    } else {
        (
            "Authentication Failed",
            error_msg.as_str(),
            "#EF4444", // Red
        )
    };

    let html = format!(
        r#"
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
        }}
        .container {{
            text-align: center;
            padding: 40px;
            background: rgba(255,255,255,0.05);
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            max-width: 400px;
        }}
        .icon {{
            font-size: 64px;
            margin-bottom: 20px;
        }}
        h1 {{
            color: {};
            margin-bottom: 16px;
        }}
        p {{
            color: #94a3b8;
            line-height: 1.6;
        }}
        .bulwark {{
            font-weight: bold;
            color: #818cf8;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">{}</div>
        <h1>{}</h1>
        <p>{}</p>
        <p>Return to <span class="bulwark">Bulwark CLI</span></p>
    </div>
    <script>
        // Auto-close after 5 seconds
        setTimeout(() => window.close(), 5000);
    </script>
</body>
</html>
"#,
        title,
        color,
        if success { "✓" } else { "✗" },
        title,
        message
    );

    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        html.len(),
        html
    );

    let _ = stream.write_all(response.as_bytes());
    let _ = stream.flush();
}

/// Open URL in default browser
fn open_browser(url: &str) -> Result<()> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(url)
            .spawn()
            .context("Failed to open browser on macOS")?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(url)
            .spawn()
            .context("Failed to open browser on Linux")?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", url])
            .spawn()
            .context("Failed to open browser on Windows")?;
    }

    Ok(())
}

/// Logout - clear stored credentials
pub fn logout() -> Result<()> {
    let mut config = CliConfig::load()?;

    if config.user.is_none() {
        print_info("You are not logged in.");
        return Ok(());
    }

    let user_name = config
        .user
        .as_ref()
        .and_then(|u| u.name.as_deref().or(u.email.as_deref()))
        .unwrap_or("User")
        .to_string();

    config.auth_token = None;
    config.user = None;
    config.save()?;

    print_success(&format!("Logged out {}. Goodbye!", user_name));
    Ok(())
}

/// Check current login status
pub fn status() -> Result<()> {
    let config = CliConfig::load()?;

    if let Some(ref user) = config.user {
        println!();
        print_success("Currently logged in:");
        if let Some(ref name) = user.name {
            println!("  Name:        {}", name);
        }
        if let Some(ref email) = user.email {
            println!("  Email:       {}", email);
        }
        println!("  User ID:     {}", user.id);
        println!(
            "  Whitelisted: {}",
            if user.whitelisted { "Yes ✓" } else { "No" }
        );

        // Show queued analyses count
        if !config.queued_analyses.is_empty() {
            println!();
            print_warning(&format!(
                "{} analyses queued for sync",
                config.queued_analyses.len()
            ));
        }
    } else {
        println!();
        print_info("Not logged in.");
        println!("  Run 'bulwark login' to authenticate.");
    }

    Ok(())
}

/// Check if user is authenticated and whitelisted
pub fn is_whitelisted() -> bool {
    CliConfig::load()
        .ok()
        .and_then(|c| c.user)
        .map(|u| u.whitelisted)
        .unwrap_or(false)
}

/// Check if user is authenticated
pub fn is_authenticated() -> bool {
    CliConfig::load()
        .ok()
        .map(|c| c.auth_token.is_some())
        .unwrap_or(false)
}
