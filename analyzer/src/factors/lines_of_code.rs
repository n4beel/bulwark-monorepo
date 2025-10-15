//! Lines of Code Analysis Factor
//!
//! This module provides functionality to count Source Lines of Code (SLOC)
//! in Rust files, excluding comments and empty lines.

/// Count lines of code in a given content string, excluding comments and empty lines
/// 
/// This function replicates the logic from the TypeScript lineCounter function:
/// - Skips empty lines
/// - Handles multi-line comments (/* ... */)
/// - Handles single-line comments (//)
/// - Counts lines that contain actual code
/// 
/// # Arguments
/// * `content` - The source code content as a string
/// 
/// # Returns
/// * `usize` - The number of source lines of code
pub fn count_lines_of_code(content: &str) -> usize {
    let lines: Vec<&str> = content.split('\n').collect();
    let mut code_lines = 0;
    let mut in_multiline_comment = false;

    for line in lines {
        let line = line.trim();

        // Skip empty lines
        if line.is_empty() {
            continue;
        }

        // Handle multi-line comments
        if in_multiline_comment {
            // Check if this line ends the multi-line comment
            if let Some(comment_end_index) = line.find("*/") {
                in_multiline_comment = false;
                
                // Check if there's code after the comment end
                let remaining_line = line[(comment_end_index + 2)..].trim();
                if !remaining_line.is_empty() && !remaining_line.starts_with("//") {
                    code_lines += 1;
                }
            }
            continue;
        }

        // Check for start of multi-line comment
        if let Some(comment_start_index) = line.find("/*") {
            // Check if there's code before the comment start
            let code_before_comment = line[..comment_start_index].trim();

            // Check if the comment ends on the same line
            let search_start = comment_start_index + 2;
            if let Some(relative_end_index) = line[search_start..].find("*/") {
                let actual_end_index = search_start + relative_end_index + 2;
                
                // Single-line multi-line comment /* ... */
                let code_after_comment = if actual_end_index < line.len() {
                    line[actual_end_index..].trim()
                } else {
                    ""
                };
                let has_code_before = !code_before_comment.is_empty();
                let has_code_after = !code_after_comment.is_empty() && !code_after_comment.starts_with("//");

                if has_code_before || has_code_after {
                    code_lines += 1;
                }
            } else {
                // Multi-line comment starts here
                in_multiline_comment = true;
                if !code_before_comment.is_empty() {
                    code_lines += 1;
                }
            }
            continue;
        }

        // Check for single-line comments
        if let Some(single_comment_index) = line.find("//") {
            // Check if there's code before the comment
            let code_before_comment = line[..single_comment_index].trim();
            if !code_before_comment.is_empty() {
                code_lines += 1;
            }
            continue;
        }

        // If we get here, it's a regular code line
        code_lines += 1;
    }

    code_lines
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_content() {
        assert_eq!(count_lines_of_code(""), 0);
    }

    #[test]
    fn test_only_whitespace() {
        assert_eq!(count_lines_of_code("   \n\t\n   "), 0);
    }

    #[test]
    fn test_simple_code() {
        let content = r#"
fn main() {
    println!("Hello, world!");
}
        "#;
        assert_eq!(count_lines_of_code(content), 3);
    }

    #[test]
    fn test_single_line_comments() {
        let content = r#"
fn main() { // This is a comment
    // This is just a comment
    println!("Hello"); // Another comment
}
        "#;
        assert_eq!(count_lines_of_code(content), 3);
    }

    #[test]
    fn test_multiline_comments() {
        let content = r#"
/* This is a
   multi-line comment */
fn main() {
    /* Another comment */ println!("Hello");
    /*
     * Block comment
     */
    let x = 5; /* inline comment */
}
        "#;
        // Expected lines of code:
        // 1. fn main() {
        // 2. /* Another comment */ println!("Hello");
        // 3. let x = 5; /* inline comment */
        // 4. }
        assert_eq!(count_lines_of_code(content), 4);
    }

    #[test]
    fn test_mixed_comments() {
        let content = r#"
// Single line comment
fn main() { /* multi-line start
   continues here */ 
    let x = 5; // inline comment
    /* 
     * Block comment
     * continues
     */ let y = 10; // another inline
}
        "#;
        assert_eq!(count_lines_of_code(content), 4);
    }

    #[test]
    fn test_comment_with_code_on_same_line() {
        let content = r#"
let x = 5; /* comment */ let y = 10;
let a = /* comment */ 15;
/* comment */ let b = 20;
        "#;
        assert_eq!(count_lines_of_code(content), 3);
    }

    #[test]
    fn test_complex_rust_code() {
        let content = r#"
//! This is a module doc comment
use std::collections::HashMap;

/// Function documentation
pub fn calculate_something(x: i32) -> i32 {
    // Calculate the result
    let mut result = x * 2; // Multiply by 2
    
    /* 
     * Some complex logic here
     * that spans multiple lines
     */
    if result > 100 {
        result = 100; // Cap at 100
    }
    
    result // Return the result
}

#[cfg(test)]
mod tests {
    // Test module
    use super::*;
    
    #[test]
    fn test_basic() {
        assert_eq!(calculate_something(50), 100);
    }
}
        "#;
        // Expected lines of code:
        // 1. use std::collections::HashMap;
        // 2. pub fn calculate_something(x: i32) -> i32 {
        // 3. let mut result = x * 2;
        // 4. if result > 100 {
        // 5. result = 100;
        // 6. }
        // 7. result
        // 8. }
        // 9. #[cfg(test)]
        // 10. mod tests {
        // 11. use super::*;
        // 12. #[test]
        // 13. fn test_basic() {
        // 14. assert_eq!(calculate_something(50), 100);
        // 15. }
        // 16. }
        assert_eq!(count_lines_of_code(content), 16);
    }
}