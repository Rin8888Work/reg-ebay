import { faker } from "@faker-js/faker";
import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import path from "path";
import LDPlayer from "./utils/ldplayer.js";
import express from "express";
import { refreshIp } from "./utils/helper.js";
const app = express();
const port = 3000;

const axiosInstance = axios.create({
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

async function fetchHTML(url, wmCoookie) {
  try {
    const response = await axiosInstance.get(url, {
      headers: {
        Cookie: wmCoookie,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0",
        Referer: "https://www.walmart.com/cp/groceries-essentials/1735450",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });
    return response.data;
  } catch (error) {
    console.log("Error fetching the HTML:", error);
    return null;
  }
}

async function downloadImage(url, folder, filename) {
  try {
    const response = await axiosInstance.get(url, {
      responseType: "arraybuffer",
    });
    const filePath = path.join(folder, filename);
    fs.writeFileSync(filePath, response.data);

    console.log("Image downloaded successfully:", filePath);
    return path.join(process.cwd(), filePath);
  } catch (error) {
    console.error("Error downloading image:", error);
  }
}

async function main(index, wmCoookie) {
  const productRandom = faker.commerce.productName();
  const walmartURL = "https://www.walmart.com";
  const searchURL = `${walmartURL}/search?q=${productRandom
    .toLowerCase()
    .replaceAll(" ", "+")}&min_price=80&max_price=120`;
  console.log(searchURL);
  // Fetching HTML from the Walmart URL
  const html = await fetchHTML(searchURL, wmCoookie);

  if (!html) {
    console.error("No HTML fetched");
    return;
  }

  // Load HTML into cheerio
  const $ = cheerio.load(html);

  // Now you can use cheerio to parse and manipulate the HTML
  // For example, let's extract the titles of all products
  const product = $(`[data-testid="item-stack"] [data-item-id]`).first();
  const productURL = walmartURL + $(product).find(`a`).attr("href");
  console.log(productURL);
  const htmlDetail = await fetchHTML(productURL, wmCoookie);
  const ok = cheerio.load(htmlDetail);
  const productScript = ok('script[type="application/ld+json"]').filter(
    (index, element) => {
      const scriptContent = ok(element).html();
      return scriptContent.includes('"@type":"Product"');
    }
  );
  const { image, name, sku, description, brand, offers } = JSON.parse(
    productScript.text().trim()
  );

  const folder = "./images";
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  const filenameImgPart = image
    .split("/")
    [image.split("/").length - 1].split(".");
  const filenameImg = `${filenameImgPart[1]}.${filenameImgPart[2]}`;
  const pathImage = await downloadImage(image, folder, filenameImg);
  console.log({ pathImage });

  const ld = new LDPlayer();
  ld.info("index", index);
  ld.pushImg(pathImage, filenameImg);
  fs.unlink(pathImage, (err) => {
    if (err) {
      return;
    }
  });

  return {
    image,
    name,
    sku,
    description,
    brand: brand?.name,
    price: offers?.price,
  };
}

// Thiết lập view engine là Pug
app.set("view engine", "pug");

// Thiết lập đường dẫn cho các tệp tĩnh
app.use(express.static("public"));

app.get("/clear", async (req, res) => {
  const baseLD = req.query.baseLD;
  console.log({ baseLD });

  const ld = new LDPlayer();
  const allLd = ld.getDevices2();
  const index = allLd.find((dv) => dv.name === baseLD).index;
  ld.info("index", index);
  ld.clearDownload();
  res.json({ result: "ok" });
});

app.get("/get", async (req, res) => {
  try {
    const baseLD = req.query.baseLD;
    const refreshIPLink = req.query.refreshIPLink;
    const wmCoookie = req.query.wmCoookie;
    const isRefreshSuccess = await refreshIp(refreshIPLink);
    const ld = new LDPlayer();
    const allLd = ld.getDevices2();
    const data = await main(
      allLd.find((dv) => dv.name === baseLD).index,
      wmCoookie
    );
    res.json({ success: true, isRefreshSuccess, data });
  } catch (error) {
    res.json({ success: false, error });
  }
});

// Định nghĩa route để hiển thị dữ liệu
app.get("/", async (req, res) => {
  res.render("index");
});

// Khởi động máy chủ
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
