import { logg } from "./utils/helper.js";
import LDPlayer from "./utils/ldplayer.js";
import fs from "fs";
import path from "path";

const profileNames = process.argv[2].split("--profile=")[1].split("\n");
const backupFolderPath = "E:\\BACKUP_LD_EBAY";

function findBackupFile(profileName, folderPath) {
  const files = fs.readdirSync(folderPath);
  const backupFile = files.find((file) => {
    return file.startsWith(profileName) && file.endsWith(".ldbk");
  });

  if (backupFile) {
    return path.join(folderPath, backupFile);
  } else {
    const subDirectories = files.filter((file) =>
      fs.statSync(path.join(folderPath, file)).isDirectory()
    );
    for (const subDir of subDirectories) {
      const result = findBackupFile(profileName, path.join(folderPath, subDir));
      if (result) return result;
    }
    return null;
  }
}

if (backupFolderPath) {
  for (let index = 0; index < profileNames.length; index++) {
    const profile = new LDPlayer();
    try {
      profile.create(profileNames[index]);
    } catch (error) {}
    try {
      const backupFilePath = findBackupFile(
        profileNames[index],
        backupFolderPath
      );
      if (backupFilePath) {
        profile.restore(profileNames[index], backupFilePath);
        logg("Restore thành công: " + profileNames[index]);

        // Xóa file backup sau khi restore thành công
        fs.unlinkSync(backupFilePath);
        logg("Đã xóa file backup: " + backupFilePath);
      } else {
        logg("Không tìm thấy file backup cho: " + profileNames[index]);
      }
    } catch (error) {
      profile.remove("name", profileNames[index]);
      logg("Restore thất bại: " + profileNames[index]);
      continue;
    }
  }
}
