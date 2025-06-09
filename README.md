# Tnotes
This is a MacOS notetaking app that I built for my girlfriend with Tauri, Rust, and Vanilla JS.

It has two main features:
- The background transparency is tuneable (which allows you to type notes in front of other tasks like videos, calls, or reference text)
- It allows easy export of a note to apple notes

On top, it supports Markdown formatting for the Notes export -- at least as far as Apple Notes supports Markdown mid 2025 (which sadly doesn't include checkboxes).

-------

This is how it looks:

<img width="752" alt="Screenshot 2025-06-10 at 01 52 07" src="https://github.com/user-attachments/assets/a1766bde-5c26-4b07-9581-6611f7d85115" />

# Installation
I plan on making a small website to download the `.dmg` but until that is ready, you can create the installer by running

```bash
cargo tauri build
```
which outputs the folder that contains the `.dmg`.

To run this, you need to have Tauri installed (`cargo install tauri`).

You can run the dev server with: 
```bash
cargo tauri dev
```
