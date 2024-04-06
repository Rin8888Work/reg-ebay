import ADB from "./utils/adb.js";
import { delay, logg } from "./utils/helper.js";

const dumpXmlFile = ADB.DumXml(process.argv[2]);
logg(dumpXmlFile);
