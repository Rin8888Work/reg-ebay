import xml2js from "xml2js";
import { exec, execSync } from "child_process";
import fs from "fs";
import axios from "axios";

export function getRandomColor() {
  const colors = [
    "\x1b[31m", // Đỏ
    "\x1b[32m", // Xanh lá cây
    "\x1b[33m", // Vàng
    "\x1b[34m", // Xanh dương
    "\x1b[35m", // Tím
    "\x1b[36m", // Xanh da trời
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
export function logg(message) {
  const color = getRandomColor();
  console.log(color + JSON.stringify(message) + "\x1b[0m"); // Kết thúc màu
}

export function delay(s, isMilisecond) {
  return new Promise((resolve) =>
    setTimeout(resolve, isMilisecond ? s : s * 1000)
  );
}

export function delayRandom(minSeconds = 1, maxSeconds = 3) {
  const randomDelay =
    Math.random() * (maxSeconds - minSeconds + 1) + minSeconds; // Generate a random delay in seconds within the specified range
  return new Promise((resolve) => setTimeout(resolve, randomDelay * 1000));
}

export function findNodes(nodes, key, value) {
  let foundNodes = [];
  nodes.forEach((node) => {
    if (node.$[key] === value) {
      foundNodes.push(node);
    }
    if (node.node) {
      foundNodes = foundNodes.concat(findNodes(node.node, key, value));
    }
  });
  return foundNodes;
}

export function getPosElement(fileContent, key, value) {
  let x1, y1, x2, y2;
  xml2js.parseString(fileContent, (err, result) => {
    if (err) {
      console.error(err);
      return;
    }
    const nodes = findNodes(result.hierarchy.node, key, value);

    if (nodes.length > 0) {
      const bounds = nodes[0].$.bounds;
      const [_x1, _y1, _x2, _y2] = bounds
        .replace("][", ",")
        .replace("[", "")
        .replace("]", "")
        .split(",");

      x1 = _x1;
      y1 = _y1;
      x2 = _x2;
      y2 = _y2;
    }
  });
  return {
    x1: parseInt(x1),
    y1: parseInt(y1),
    x2: parseInt(x2),
    y2: parseInt(y2),
  };
}

export function findNodesByResourceId(nodes, resourceId) {
  let foundNodes = [];
  nodes.forEach((node) => {
    if (node.$["resource-id"] === resourceId) {
      foundNodes.push(node);
    }
    if (node.node) {
      foundNodes = foundNodes.concat(
        findNodesByResourceId(node.node, resourceId)
      );
    }
  });
  return foundNodes;
}

export function getPosFromResourceId(fileContent, resourceId) {
  let x, y;
  xml2js.parseString(fileContent, (err, result) => {
    if (err) {
      console.error(err);
      return;
    }
    const nodes = findNodesByResourceId(result.hierarchy.node, resourceId);

    if (nodes.length > 0) {
      const bounds = nodes[0].$.bounds;
      const [_x, _y] = bounds.split("][")[0].replace("[", "").split(",");
      x = _x;
      y = _y;
    }
  });
  return [parseInt(x), parseInt(y)];
}

export function trackUserName(nodes) {
  let match = [];
  nodes.map((node) => {
    if (node.$["content-desc"] !== "") {
      match.push(node.$["content-desc"]);
    } else {
      if (node.node) {
        match = match.concat(trackUserName(node.node));
      }
    }
  });

  return match.filter((m) => m !== "" || m !== undefined)[0] ?? undefined;
}

export function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function executeCommand(cmdCommand, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const process = exec(cmdCommand, { timeout });

    let result = "";
    process.stdout.on("data", (data) => {
      result += data;
    });

    process.on("exit", (code) => {
      if (result.includes("error")) {
        reject(new Error(`Process exited with code ${code}`));
      }
      resolve(result);
    });

    process.on("error", (err) => {
      reject(err);
    });
  });
}

export function retry(command, retryCount = 5, timeout = 10000) {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    function tryCommand() {
      attempt++;
      console.log(`Attempt connect profile ${attempt}/${retryCount}`);
      executeCommand(command, timeout)
        .then(resolve)
        .catch(async (error) => {
          if (attempt < retryCount) {
            await delay(10);
            tryCommand();
          } else {
            reject(error);
          }
        });
    }

    tryCommand();
  });
}

export function readAndRemoveLine(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      // Tách dữ liệu thành các dòng
      const lines = data.split("\n");

      // Lấy dòng đầu tiên
      const firstLine = lines[0].trim();

      // // Xóa dòng đầu tiên
      lines.shift();

      // Ghi lại dữ liệu vào tệp
      fs.writeFile(filePath, lines.join("\n"), "utf8", (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(firstLine);
      });
    });
  });
}

export async function refreshIp(link) {
  try {
    // Make a GET request to the API endpoint
    const response = await axios.get(link);

    // Extract data from the response
    const data = response.data;
    console.log(data);
    return true;
  } catch (error) {
    // Handle any errors
    return false;
  }
}

export function getArgvProcess(args) {
  const result = [];
  args?.map((arg) => {
    if (arg.includes("=")) {
      const matchArg = arg.replaceAll("-", "").split("=");
      const [flag, value] = matchArg;
      result.push({ flag, value });
    }
  });
  return result;
}

export function getArg(argName, args) {
  return args.find((i) => i.flag === argName);
}
