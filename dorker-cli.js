#!/usr/bin/env node

import chalk from 'chalk';
import fs    from 'fs';

// ─── Args ─────────────────────────────────────────────────────────────────────
const args     = process.argv.slice(2);
const target   = args[0];

function getFlag(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}
function hasFlag(flag) { return args.includes(flag); }

const categoryArg = getFlag('--category');
const outPath     = getFlag('--out');
const limitArg    = parseInt(getFlag('--limit') || '0');
const listCats    = hasFlag('--list-categories');

// ─── Dork Library ─────────────────────────────────────────────────────────────
// {target} = domain/keyword, {domain} = domain only (no path)
const DORK_LIBRARY = {
  files: {
    label: 'Exposed Files',
    color: 'yellow',
    dorks: [
      'site:{target} filetype:pdf',
      'site:{target} filetype:xls OR filetype:xlsx',
      'site:{target} filetype:doc OR filetype:docx',
      'site:{target} filetype:txt',
      'site:{target} filetype:log',
      'site:{target} filetype:sql',
      'site:{target} filetype:bak',
      'site:{target} filetype:conf OR filetype:config',
      'site:{target} filetype:xml',
      'site:{target} filetype:json',
      'site:{target} filetype:csv',
      'site:{target} filetype:pem OR filetype:key',
    ],
  },
  login: {
    label: 'Login & Admin Panels',
    color: 'red',
    dorks: [
      'site:{target} inurl:login',
      'site:{target} inurl:admin',
      'site:{target} inurl:signin',
      'site:{target} inurl:dashboard',
      'site:{target} inurl:portal',
      'site:{target} inurl:panel',
      'site:{target} intitle:"admin panel"',
      'site:{target} inurl:wp-admin',
      'site:{target} inurl:cpanel',
      'site:{target} inurl:webmail',
      'site:{target} inurl:administrator',
      'site:{target} inurl:phpmyadmin',
    ],
  },
  sensitive: {
    label: 'Sensitive Data & Credentials',
    color: 'magenta',
    dorks: [
      'site:{target} inurl:.env',
      'site:{target} filetype:env',
      'site:{target} inurl:config',
      'site:{target} filetype:yml inurl:config',
      'site:{target} inurl:password filetype:txt',
      'site:{target} inurl:credentials',
      'site:{target} inurl:backup',
      'site:{target} "DB_PASSWORD"',
      'site:{target} "DB_USER" OR "DB_PASS"',
      'site:{target} "api_key" OR "apikey" OR "api-key"',
      'site:{target} "secret_key" OR "SECRET_KEY"',
      'site:{target} "Authorization: Bearer"',
      'site:{target} ext:json "password"',
      'site:{target} "-----BEGIN RSA PRIVATE KEY-----"',
    ],
  },
  subdomains: {
    label: 'Subdomains & Endpoints',
    color: 'cyan',
    dorks: [
      'site:*.{target}',
      'site:*.{target} -www',
      'site:*.{target} inurl:dev',
      'site:*.{target} inurl:staging',
      'site:*.{target} inurl:test',
      'site:*.{target} inurl:api',
      'site:*.{target} inurl:beta',
      'site:*.{target} inurl:internal',
      'site:*.{target} inurl:old',
    ],
  },
  directories: {
    label: 'Open Directories',
    color: 'green',
    dorks: [
      'site:{target} intitle:"index of"',
      'site:{target} intitle:"index of /"',
      'site:{target} "parent directory"',
      'site:{target} intitle:"directory listing"',
      'site:{target} inurl:"/uploads"',
      'site:{target} inurl:"/backup"',
      'site:{target} inurl:"/files"',
      'site:{target} inurl:"/temp" OR inurl:"/tmp"',
    ],
  },
  vulns: {
    label: 'Vulnerability Indicators',
    color: 'red',
    dorks: [
      'site:{target} inurl:"?id="',
      'site:{target} inurl:"?page="',
      'site:{target} inurl:"?file="',
      'site:{target} inurl:"?redirect=" OR inurl:"?url="',
      'site:{target} inurl:".php?id="',
      'site:{target} inurl:xmlrpc.php',
      'site:{target} inurl:".git" intitle:"index of"',
      'site:{target} inurl:phpinfo.php',
      'site:{target} inurl:wp-content/uploads',
      'site:{target} "SQL syntax" OR "mysql_fetch"',
      'site:{target} "Warning: include" OR "Warning: require"',
      'site:{target} inurl:"/.svn/"',
    ],
  },
  emails: {
    label: 'Email Addresses',
    color: 'blue',
    dorks: [
      '"@{target}"',
      'site:{target} intext:"@{target}"',
      '"@{target}" filetype:pdf',
      '"@{target}" filetype:xlsx',
      '"@{target}" filetype:csv',
      'site:{target} "contact" intext:"@"',
    ],
  },
  cameras: {
    label: 'Cameras & Live Feeds',
    color: 'yellow',
    dorks: [
      'site:{target} inurl:view/index.shtml',
      'site:{target} inurl:"/view.shtml"',
      'site:{target} intitle:"live view"',
      'site:{target} intitle:"webcam"',
      'site:{target} intitle:"IP Camera" inurl:lvappl',
      'site:{target} inurl:axis-cgi/jpg',
    ],
  },
  social: {
    label: 'Social & People',
    color: 'cyan',
    dorks: [
      'site:linkedin.com "{target}"',
      'site:twitter.com "{target}"',
      'site:facebook.com "{target}"',
      'site:github.com "{target}"',
      'site:pastebin.com "{target}"',
      'site:reddit.com "{target}"',
      '"site:{target}" site:pastebin.com',
      '"{target}" "leaked" OR "breach" OR "dump"',
    ],
  },
  tech: {
    label: 'Technology Stack',
    color: 'green',
    dorks: [
      'site:{target} inurl:wp-content',
      'site:{target} inurl:wp-includes',
      'site:{target} "Powered by" inurl:{target}',
      'site:{target} inurl:joomla',
      'site:{target} inurl:drupal',
      'site:{target} inurl:laravel',
      'site:{target} "X-Powered-By"',
      'site:{target} inurl:server-status',
      'site:{target} inurl:.htaccess',
    ],
  },
};

// ─── Google search URL builder ────────────────────────────────────────────────
function buildURL(dork) {
  return `https://www.google.com/search?q=${encodeURIComponent(dork)}`;
}

// ─── Apply target to dork template ───────────────────────────────────────────
function applyTarget(template, target) {
  return template.replaceAll('{target}', target);
}

// ─── Banner ───────────────────────────────────────────────────────────────────
function printBanner() {
  console.log(chalk.blue(`
  ██████╗  ██████╗ ██████╗ ██╗  ██╗███████╗██████╗      ██████╗██╗     ██╗
  ██╔══██╗██╔═══██╗██╔══██╗██║ ██╔╝██╔════╝██╔══██╗    ██╔════╝██║     ██║
  ██║  ██║██║   ██║██████╔╝█████╔╝ █████╗  ██████╔╝    ██║     ██║     ██║
  ██║  ██║██║   ██║██╔══██╗██╔═██╗ ██╔══╝  ██╔══██╗    ██║     ██║     ██║
  ██████╔╝╚██████╔╝██║  ██║██║  ██╗███████╗██║  ██║    ╚██████╗███████╗██║
  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝     ╚═════╝╚══════╝╚═╝
  `));
  console.log(chalk.gray('  Google Dork Generator  |  For Educational & Ethical Use Only\n'));
}

const sep = () => console.log(chalk.gray('  ' + '─'.repeat(66)));

// ─── Print help ───────────────────────────────────────────────────────────────
function printHelp() {
  console.log(chalk.white('  Usage:\n'));
  console.log(chalk.gray('    node dorker-cli.js <target> [options]\n'));
  console.log(chalk.white('  Options:\n'));
  console.log(chalk.gray('    --category <name>   Only show dorks for a specific category'));
  console.log(chalk.gray('    --limit <n>         Limit dorks per category'));
  console.log(chalk.gray('    --out <file>        Export all dorks to a .txt file'));
  console.log(chalk.gray('    --list-categories   List all available categories\n'));
  console.log(chalk.white('  Examples:\n'));
  console.log(chalk.gray('    node dorker-cli.js example.com'));
  console.log(chalk.gray('    node dorker-cli.js example.com --category login'));
  console.log(chalk.gray('    node dorker-cli.js example.com --category sensitive --limit 5'));
  console.log(chalk.gray('    node dorker-cli.js example.com --out dorks.txt\n'));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  printBanner();

  // List categories mode
  if (listCats) {
    console.log(chalk.white('  Available categories:\n'));
    for (const [key, cat] of Object.entries(DORK_LIBRARY)) {
      console.log(chalk.blue(`  ${key.padEnd(14)}`) + chalk.gray(`→ ${cat.label}  (${cat.dorks.length} dorks)`));
    }
    console.log('');
    return;
  }

  if (!target || target.startsWith('--')) {
    printHelp();
    process.exit(0);
  }

  // Validate category if given
  if (categoryArg && !DORK_LIBRARY[categoryArg]) {
    console.log(chalk.red(`  [!] Unknown category: "${categoryArg}"`));
    console.log(chalk.gray(`  [i] Run with --list-categories to see all available categories.\n`));
    process.exit(1);
  }

  const selectedCats = categoryArg
    ? { [categoryArg]: DORK_LIBRARY[categoryArg] }
    : DORK_LIBRARY;

  console.log(chalk.blue(`  [*] Target  » ${chalk.white.bold(target)}`));
  console.log(chalk.gray(`  [i] Categories: ${chalk.white(Object.keys(selectedCats).join(', '))}`));

  let totalDorks = 0;
  const exportLines = [`# Dorker-CLI — Target: ${target}`, `# Generated: ${new Date().toISOString()}`, ''];

  sep();

  for (const [key, cat] of Object.entries(selectedCats)) {
    let dorks = cat.dorks;
    if (limitArg > 0) dorks = dorks.slice(0, limitArg);

    const colorFn = chalk[cat.color] || chalk.white;
    console.log(`\n  ${colorFn.bold(`[${cat.label.toUpperCase()}]`)}  ${chalk.gray(`(${dorks.length} dorks)`)}\n`);

    exportLines.push(`## ${cat.label}`);

    for (const template of dorks) {
      const dork = applyTarget(template, target);
      const url  = buildURL(dork);

      console.log(chalk.gray('  ┌ ') + chalk.white(dork));
      console.log(chalk.gray('  └ ') + chalk.blue.underline(url));
      console.log('');

      exportLines.push(dork);
      exportLines.push(url);
      exportLines.push('');

      totalDorks++;
    }
  }

  sep();
  console.log(chalk.blue(`\n  [*] Total dorks generated: ${chalk.white.bold(totalDorks)}`));

  // Export
  if (outPath) {
    fs.writeFileSync(outPath, exportLines.join('\n'), 'utf8');
    console.log(chalk.blue(`  [*] Exported to: ${chalk.white.bold(outPath)}`));
  }

  console.log(chalk.gray('\n  [i] Tip: Paste any Google URL into your browser to run the dork.'));
  console.log(chalk.gray('  [i] Use --category to focus on a specific attack surface.\n'));
}

main().catch(err => {
  console.error(chalk.red(`\n  [!] Error: ${err.message}\n`));
  process.exit(1);
});
