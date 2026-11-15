const { execFile } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const adminUser = {
  id: '3850adc7-8d80-43d0-b27c-0f0b80546fac',
  email: 'admin@saas.com',
  full_name: 'Rajesh Sharma',
  role: 'admin',
  department: 'Executive',
  designation: 'Managing Director'
};

const headUser = {
  id: '5e359676-0a74-4ed5-8f35-b35ee5ee370e',
  email: 'head@saas.com',
  full_name: 'Vikram Malhotra',
  role: 'project_head',
  department: 'Engineering',
  designation: 'VP of Projects'
};

const memberUser = {
  id: '5e1cf670-e91a-4904-8799-4895e5a92654',
  email: 'member@saas.com',
  full_name: 'Aravind Kumar',
  role: 'team_member',
  department: 'Engineering',
  designation: 'Senior Developer'
};

async function capture(targetRoute, user, outputFilename) {
  const profileDir = path.join(os.tmpdir(), 'chrome_snap_' + Math.floor(Math.random() * 1000000));
  const bridgeFilename = 'bridge_' + Math.floor(Math.random() * 10000) + '.html';
  const bridgeFile = path.resolve('frontend/public/' + bridgeFilename);

  const html = `<!DOCTYPE html>
<html>
<body>
<script>
  localStorage.setItem('saas_user', JSON.stringify(${JSON.stringify(user)}));
  window.location.replace('${targetRoute}');
</script>
</body>
</html>`;

  fs.writeFileSync(bridgeFile, html, 'utf-8');
  const tmpFile = path.join(os.tmpdir(), 'out_' + outputFilename);
  const destFile = path.resolve(outputFilename);

  console.log(`Capturing ${targetRoute} -> ${outputFilename}`);
  await new Promise((resolve) => {
    let resolved = false;
    const child = execFile(chromePath, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--window-size=1440,900',
      '--user-data-dir=' + profileDir,
      '--virtual-time-budget=6000',
      '--screenshot=' + tmpFile,
      'http://localhost:5174/' + bridgeFilename
    ], (err, stdout, stderr) => {
      if (resolved) return;
      resolved = true;
      if (fs.existsSync(tmpFile)) {
        fs.copyFileSync(tmpFile, destFile);
        fs.unlinkSync(tmpFile);
        console.log(`[SUCCESS] Saved ${outputFilename} (${fs.statSync(destFile).size} bytes)`);
      } else {
        console.error(`[ERROR] Could not capture ${outputFilename}:`, stderr);
      }
      try { fs.unlinkSync(bridgeFile); } catch (e) {}
      resolve();
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try { child.kill(); } catch (e) {}
        if (fs.existsSync(tmpFile)) {
          fs.copyFileSync(tmpFile, destFile);
          fs.unlinkSync(tmpFile);
          console.log(`[SUCCESS on timeout] Saved ${outputFilename} (${fs.statSync(destFile).size} bytes)`);
        } else {
          console.error(`[TIMEOUT] Could not capture ${outputFilename}`);
        }
        try { fs.unlinkSync(bridgeFile); } catch (e) {}
        resolve();
      }
    }, 12000);
  });
}

async function main() {
  await capture('/admin', adminUser, 'screenshot_admin_dashboard.png');
  await capture('/head', headUser, 'screenshot_project_head_dashboard.png');
  await capture('/admin/projects', adminUser, 'screenshot_projects_portfolio.png');
  await capture('/member', memberUser, 'screenshot_team_member_dashboard.png');
  await capture('/admin/hr', adminUser, 'screenshot_hr_management.png');
  console.log('All captures completed!');
  process.exit(0);
}

main();
