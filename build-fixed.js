const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// CONFIGURATION
const APP_NAME = "Youtube-GT";
const URL = "https://youtube.com";
const INJECT_FILE = "inject.js";

// 1. FIX SCRIPT INJECTION (Write a robust inject.js)
// This ensures the script waits for the element to actually exist before running.
const injectContent = `
document.addEventListener('DOMContentLoaded', () => {
    applyTweaks();
});

// Backup: Run on window load just in case
window.addEventListener('load', () => {
    applyTweaks();
});

function applyTweaks() {
    console.log("Pake: Injection Active");
    
    // Create a style element to hide the top bar cleanly
    // This prevents the "flash" of the header before it disappears
    const style = document.createElement('style');
    style.innerHTML = \`
        .ytd-masthead, #masthead-container { display: none !important; }
    \`;
    document.head.appendChild(style);
}
`;

console.log(`[1/3] Creating fixed ${INJECT_FILE}...`);
fs.writeFileSync(INJECT_FILE, injectContent);


// 2. REMOVE WINDOWS MENU BAR (Patch main.rs)
// We look for the Rust file and comment out the menu line automatically.
const rustPath = path.join('src-tauri', 'src', 'main.rs');
if (fs.existsSync(rustPath)) {
    console.log("[2/3] Patching Rust code to remove Menu Bar...");
    let rustContent = fs.readFileSync(rustPath, 'utf8');

    // Regex to find .menu(pake::get_menu()) or similar and comment it out
    // We replace it with a commented version
    if (!rustContent.includes('// .menu(')) {
        rustContent = rustContent.replace(
            /\.menu\(.*?\)/g, 
            '// .menu(pake::get_menu()) /* DISABLED BY SCRIPT */'
        );
        fs.writeFileSync(rustPath, rustContent);
        console.log("      -> Menu bar disabled in source.");
    } else {
        console.log("      -> Menu bar already disabled.");
    }
} else {
    console.warn("      -> WARNING: Could not find src-tauri/src/main.rs. Are you in the Pake root?");
}


// 3. RUN THE BUILD
console.log("[3/3] Starting Build Process...");
try {
    // This runs the standard pake build command using the new injection file
    // Adjust 'npm run build' if you use a specific CLI command
    execSync(`pake ${URL} --name ${APP_NAME} --inject ./${INJECT_FILE}`, { stdio: 'inherit' });
    console.log("\nSUCCESS! Build complete.");
} catch (error) {
    console.error("\nBuild Failed:", error.message);
}
