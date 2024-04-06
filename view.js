import { faker } from "@faker-js/faker";
import ADB from "./utils/adb.js";
import {
  delay,
  delayRandom,
  getRandomNumber,
  logg,
  refreshIp,
} from "./utils/helper.js";
import LDPlayer from "./utils/ldplayer.js";

class Reg {
  constructor(ldProfile, infoAcc) {
    console.log(ldProfile);
    this.ldProfile = ldProfile;
    this.index = ldProfile["index"];
    this.ldPlayer = new LDPlayer();
    this.infoAcc = infoAcc;
  }

  getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0"); // Lấy giờ và thêm số 0 nếu cần
    const minutes = String(now.getMinutes()).padStart(2, "0"); // Lấy phút và thêm số 0 nếu cần
    const seconds = String(now.getSeconds()).padStart(2, "0"); // Lấy giây và thêm số 0 nếu cần

    return `${hours}:${minutes}:${seconds}`;
  }

  async ebayViewProduct(profile, qty = 2, reg = false) {
    await delayRandom(5, 10);
    // search product
    await profile.tapXml("com.ebay.mobile:id/ui_bottom_nav_menu_action_home");
    await profile.randomSwipe();

    await delay(1);
    await profile.tapXml("com.ebay.mobile:id/ui_bottom_nav_menu_action_search");
    const productRandom = faker.commerce.productName();
    logg(`Search product ${productRandom}`);
    await delayRandom(2, 5);
    await profile.sendText(productRandom);
    await delayRandom();
    profile.keyEvent(ADB.KEYCODE_ENTER);
    await delayRandom(10, 15);

    // view 3 item
    for (let i = 0; i < qty; i++) {
      logg(`Xem item lần thứ ${i + 1}`);
      // swipe random
      await profile.randomSwipe();

      // Tap random product
      const isClickedProduct = profile.tapRandomEbayProduct(
        "com.ebay.mobile:id/cell_collection_item"
      );
      const imagesPos = profile.getPosXml("com.ebay.mobile:id/imageview_image");

      await delayRandom(2, 5);

      if (isClickedProduct) {
        // swipe images
        for (let ii = 0; ii < 6; ii++) {
          const randomLeftOrRight = getRandomNumber(0, 2);

          let x = imagesPos[0] + 400;
          let x2 = imagesPos[0] + 400;
          let y = imagesPos[1];

          if (randomLeftOrRight === 1) {
            x2 = x2 + 200;
          } else {
            x2 = x2 - 200;
          }
          if (getRandomNumber(1, 3) == 2) {
            await profile.tapXml("com.ebay.mobile:id/imageview_image");
            await delayRandom(1, 3);
            await profile.randomSwipe(2, 5);
            profile.click(5, 42);
            break;
          } else {
            profile.swipe(x, y, x2, y, 200);
            await delayRandom(1, 3);
          }
        }

        let viewAboutItem = {
          key: "content-desc",
          value: "More information - About this item",
          viewed: false,
        };

        let viewDescriptionItem = {
          key: "content-desc",
          value: "See full description",
          viewed: false,
        };

        let viewProductDetail = {
          key: "content-desc",
          value: "Product details",
          viewed: false,
        };

        let swipeCarouselItems = {
          key: "resource-id",
          value: "com.ebay.mobile:id/recyclerview_items",
          viewed: false,
        };
        // swipe random
        for (let iindex = 0; iindex < getRandomNumber(13, 15); iindex++) {
          await profile.swipe(
            getRandomNumber(300, 500),
            getRandomNumber(750, 800),
            getRandomNumber(300, 500),
            getRandomNumber(400, 450),
            getRandomNumber(300, 500)
          );
          const viewAboutItemPos = await profile.getPos({ ...viewAboutItem });
          const viewDescriptionItemPos = await profile.getPos({
            ...viewDescriptionItem,
          });
          const viewProductDetailPos = await profile.getPos({
            ...viewProductDetail,
          });
          const swipeCarouselItemsPos = await profile.getPos({
            ...swipeCarouselItems,
          });

          if (!isNaN(viewAboutItemPos?.x1) && !viewAboutItem.viewed) {
            profile.click(
              getRandomNumber(viewAboutItemPos.x1, viewAboutItemPos.x2),
              getRandomNumber(viewAboutItemPos.y1, viewAboutItemPos.y2)
            );
            viewAboutItem = { ...viewAboutItem, viewed: true };
            await delayRandom(7, 10);
            await profile.swipe(
              getRandomNumber(300, 500),
              getRandomNumber(700, 800),
              getRandomNumber(300, 500),
              getRandomNumber(150, 200),
              getRandomNumber(300, 500)
            );
            await delayRandom(5, 7);
            profile.click(50, 80);
            continue;
          }
          if (
            !isNaN(viewDescriptionItemPos?.x1) &&
            !viewDescriptionItem.viewed
          ) {
            viewDescriptionItem = { ...viewDescriptionItem, viewed: true };
            profile.click(
              getRandomNumber(
                viewDescriptionItemPos.x1,
                viewDescriptionItemPos.x2
              ),
              getRandomNumber(
                viewDescriptionItemPos.y1,
                viewDescriptionItemPos.y2
              )
            );

            await profile.randomSwipe();
            profile.click(5, 42);
            continue;
          }
          if (!isNaN(viewProductDetailPos?.x1) && !viewProductDetail.viewed) {
            viewProductDetail = { ...viewProductDetail, viewed: true };
            profile.click(
              getRandomNumber(viewProductDetailPos.x1, viewProductDetailPos.x2),
              getRandomNumber(viewProductDetailPos.y1, viewProductDetailPos.y2)
            );
            await delayRandom(7, 10);
            await profile.swipe(
              getRandomNumber(300, 500),
              getRandomNumber(700, 800),
              getRandomNumber(300, 500),
              getRandomNumber(150, 200),
              getRandomNumber(300, 500)
            );
            await delayRandom(5, 7);
            profile.click(50, 80);
            continue;
          }
          if (!isNaN(swipeCarouselItemsPos?.x1)) {
            swipeCarouselItems = { ...swipeCarouselItems, viewed: true };

            for (let silic = 0; silic < getRandomNumber(2, 4); silic++) {
              console.log({ swipeCarouselItemsPos });
              await profile.swipe(
                swipeCarouselItemsPos.x2 - getRandomNumber(60, 100),
                swipeCarouselItemsPos.y1 + 100,
                swipeCarouselItemsPos.x1 + getRandomNumber(60, 100),
                swipeCarouselItemsPos.y1 + 100,
                getRandomNumber(200, 300)
              );
              await delayRandom(1, 2);
            }
          }

          viewAboutItem = { ...viewAboutItem, viewed: false };
          viewDescriptionItem = { ...viewDescriptionItem, viewed: false };
          viewProductDetail = { ...viewProductDetail, viewed: false };
          swipeCarouselItems = { ...swipeCarouselItems, viewed: false };
          await delayRandom(1, 2);
        }

        //back to search page
        profile.click(5, 42);
      }
    }
  }

  async run() {
    logg(this.getCurrentTime());
    const profile = this.ldPlayer;
    profile.info("index", this.index);
    console.log(this.ldPlayer);
    logg(`Đang mở profile id ${this.index}`);
    profile.start();
    await delay(1);

    // // // refresh IP here
    // await delay(2);
    // logg(`Đang đổi IP`);
    // await refreshIp();
    // await delay(10);

    // await delay(1);
    // logg(`Đang bật socks`);
    // profile.openApp("net.typeblog.socks");
    // await delay(5);
    // profile.tapXml(`net.typeblog.socks:id/switch_action_button`);
    // await delay(2);
    // logg(`Quay về màn hình chính`);
    // profile.keyEvent(ADB.KEYCODE_HOME);
    // await delay(10);

    // Open ebay app
    logg(`Đang đợi mở ebay`);

    // await delay(5);
    profile.openApp("com.ebay.mobile");
    await this.ebayViewProduct(profile);
    logg(this.getCurrentTime());
  }
}

const baseLD = process.argv[2];

const ld = new LDPlayer();
const allDevices = ld.getDevices2();

const thread = new Reg(
  allDevices.find((dv) => dv.name === baseLD),
  {}
);

await thread.run();
