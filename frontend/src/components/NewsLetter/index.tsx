"use client";

import Image from "next/image";
import { useState } from "react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");

  return (
    <section className="w-full py-20 px-6 flex justify-center h-150">
      <div className="w-full max-w-6xl rounded-2xl overflow-hidden relative ">
        {/* Background ASCII Face */}
        <div className="absolute inset-0">
          <Image
            src="/images/NewsLetterFace.png"
            alt="Newsletter Background"
            fill
            className="object-cover "
          />
        </div>

        {/* Content */}
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 px-10 py-14">
          {/* Left text block */}
          <div className="col-span-2 space-y-4 text-white">
            <h2 className="text-3xl font-bold tracking-wider text-white doto">
              Subscribe to Our
              <br />
              Newsletter
            </h2>

            <p className="text-sm mt-10 max-w-md">
              Get weekly updates about our product on your email, no spam
              guaranteed we promise ✌️
            </p>
          </div>

          {/* Email input + CTA positioned responsively */}
          <div
            className="
  absolute 
  -bottom-20 
  left-[43.9%]
  -translate-x-1/2
  w-[90%]
  max-w-[600px]
  z-20
  lg:w-[500px]
"
          >
            <div className="flex bg-white rounded-xl overflow-hidden shadow-lg w-full">
              <input
                type="email"
                placeholder="youremail123@gmail.com"
                className="flex-1 min-w-[200px] px-4 py-6 text-sm text-[var(--text-primary)] focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="min-w-[190px] bg-[var(--blue-primary)] cursor-pointer hover:bg-[var(--blue-hover)] text-white px-6 text-sm font-semibold transition">
                SUBSCRIBE
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
