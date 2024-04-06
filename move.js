import fs from "fs";
import path from "path";
import { logg } from "./utils/helper.js";

// Path to the folder you want to read
const folderPath = "E:\\BACKUP_LD_EBAY";
const newFolder = "BUYER-TOAN";

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

const readFileProfileNames = () => {
  return new Promise((resolve, reject) => {
    fs.readFile("name.txt", "utf8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      resolve({
        names: data
          .split("\n")
          .map((i) => i.replace("\r", ""))
          .filter((i) => i !== ""),
      });
    });
  });
};

const { names } = await readFileProfileNames();

for (let index = 0; index < names.length; index++) {
  const name = names[index];

  try {
    const backupFilePath = findBackupFile(name, folderPath);

    if (backupFilePath) {
      const destinationFilePathParts = backupFilePath.split("\\").splice(2);

      if (destinationFilePathParts.length > 1) {
        const newDestinationDir = destinationFilePathParts.slice();
        newDestinationDir.pop();
        const destinationDir = path.join(
          folderPath,
          newFolder,
          newDestinationDir.join("\\")
        );
        console.log({ destinationDir });
        if (!fs.existsSync(destinationDir)) {
          console.log({ ok: "ok" });
          fs.mkdirSync(destinationDir, {
            recursive: true,
          });
        }
      }
      fs.rename(
        backupFilePath,
        path.join(folderPath, newFolder, destinationFilePathParts.join("\\")),
        (err) => {
          if (err) {
            console.error("Error moving file:", err);
            return;
          }
          console.log(`File ${backupFilePath} moved successfully.`);
        }
      );
    } else {
      logg("Không tìm thấy file backup cho: " + name);
    }
  } catch (error) {
    logg("Di chuyển thất bại: " + name);
    console.log({ error });
    continue;
  }
}
