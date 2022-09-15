import dayjs from "dayjs";
import CustomParseFormat from "dayjs/plugin/customParseFormat";
import { bmvbhash } from "blockhash-core";
import loadImage from "blueimp-load-image";
import leven from "leven";
import distance from "@turf/distance";
import { point } from "@turf/helpers";

dayjs.extend(CustomParseFormat);

const parseEXIF = (ts) => ts && dayjs(ts, "YYYY:MM:DD HH:mm:ss").toDate();

const ConvertDMSToDD = (dms, direction) => {
  try {
    const [degrees, minutes, seconds] = dms.split(",");

    const m1 = Number(minutes) / 60;
    const s1 = Number(seconds) / (60 * 60);
    const d1 = Number(degrees);

    let dd = d1 + m1 + s1;

    if (direction === "S" || direction === "W") dd *= -1;

    return Number(dd.toFixed(4));
  } catch (e) {
    console.warn("Unable to parse GPS");
  }
};

const CleanExif = (data) => {
  if (!data) return {};

  const exif = data.getAll();

  return {
    latitude: ConvertDMSToDD(
      exif?.GPSInfo?.GPSLatitude,
      exif?.GPSInfo?.GPSLatitudeRef
    ),
    longitude: ConvertDMSToDD(
      exif?.GPSInfo?.GPSLongitude,
      exif?.GPSInfo?.GPSLongitudeRef
    ),
    dateCreated: parseEXIF(exif?.Exif?.DateTimeOriginal),
  };
};

export const imgDiff = (i1, i2) => {
  console.log(i1, i2);
  return {
    leven: leven(i1.blockHash, i2.blockHash),
    date: Math.abs(
      dayjs(i1.dateCreated).diff(dayjs(i2.dateCreated), "seconds")
    ),
    geo: distance(
      point([i1.longitude, i1.latitude]),
      point([i2.longitude, i2.latitude]),
      { units: "meters" }
    ),
  };
};

export const getExif = (file) => {
  return new Promise((resolve) => {
    try {
      loadImage(
        file,
        (_img, data) => {
          resolve(data?.exif ? CleanExif(data.exif) : {});
        },
        { meta: true }
      );
    } catch (e) {
      console.error(e);
      resolve({});
    }
  });
};

export const getBlockHash = async (file) => {
  var bitmap = await createImageBitmap(file);
  var canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  var context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0);
  var imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);

  return bmvbhash(imageData, 16);
};

export const calculateImageMeta = async (file) => {
  const [blockHash, exif] = await Promise.all([
    getBlockHash(file),
    getExif(file),
  ]);

  return { ...exif, blockHash, file, url: URL.createObjectURL(file) };
};
