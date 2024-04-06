import { delay, getArg, getArgvProcess, logg } from "./utils/helper.js";
import LDPlayer from "./utils/ldplayer.js";

const ld = new LDPlayer();
const allDevices = ld.getDevices2();
const args = getArgvProcess(process.argv);
/* 
default---> backup all 
profile? ---> backup one profile 
filePath ---> backup to filePath
oldPath? ---> remove old backup on oldPath
*/

async function backupProfile(profile, profileName, backupFolder, oldPath) {
  if (profile.isDeviceRunning()) profile.close();
  await profile.backup(backupFolder, oldPath);
  logg(`backup ${profileName} thành công`);
  await delay(5);
  await profile.remove();
}

if (!getArg("filePath", args)?.flag) {
  logg("Nhập folder backup");
} else {
  const backupFolder = getArg("filePath", args)?.value;
  const backupProfileName = getArg("profile", args)?.value;
  const oldPath = getArg("oldPath", args)?.value;

  if (backupProfileName) {
    const profile = new LDPlayer();
    const matchLd = allDevices.find((dv) => dv.name === backupProfileName);
    profile.info("index", matchLd["index"], {});
    await backupProfile(profile, matchLd["name"], backupFolder, oldPath);
  } else {
    for (let index = 0; index < allDevices.length; index++) {
      if (!["base", "R"].includes(allDevices[index]["name"])) {
        const profile = new LDPlayer();
        profile.info("index", allDevices[index]["index"], {});
        await backupProfile(
          profile,
          allDevices[index]["name"],
          backupFolder,
          oldPath
        );
      }
    }
  }
}
