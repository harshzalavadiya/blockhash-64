import dayjs from "dayjs";
import CustomParseFormat from "dayjs/plugin/customParseFormat";
import { bmvbhash } from "blockhash-core";
import loadImage from "blueimp-load-image";
import distance from "@turf/distance";
import { point } from "@turf/helpers";

dayjs.extend(CustomParseFormat);

const parseEXIF = (ts) => ts && dayjs(ts, "YYYY:MM:DD HH:mm:ss").toDate();

function hexToBin(hexString) {
  const hexBinLookup = {
    0: "0000",
    1: "0001",
    2: "0010",
    3: "0011",
    4: "0100",
    5: "0101",
    6: "0110",
    7: "0111",
    8: "1000",
    9: "1001",
    a: "1010",
    b: "1011",
    c: "1100",
    d: "1101",
    e: "1110",
    f: "1111",
    A: "1010",
    B: "1011",
    C: "1100",
    D: "1101",
    E: "1110",
    F: "1111",
  };
  let result = "";
  for (let i = 0; i < hexString.length; i++) {
    result += hexBinLookup[hexString[i]];
  }
  return result;
}

const comparePHash = (hash1, hash2) => {
  const _hash1 = hexToBin(hash1);
  const _hash2 = hexToBin(hash2);
  const minLength = Math.min(_hash1.length, _hash2.length);
  const maxLength = Math.max(_hash1.length, _hash2.length);
  let similarity = 0;
  for (let i = 0; i < minLength; i++) {
    if (_hash1[i] === _hash2[i]) {
      similarity += 1;
    }
  }
  return similarity / maxLength;
};

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
  if (
    i1.dateCreated &&
    i2.dateCreated &&
    Math.abs(dayjs(i1.dateCreated).diff(dayjs(i2.dateCreated), "seconds")) < 31
  ) {
    console.log("time");
    return 1;
  }

  if (
    i1.longitude &&
    i2.longitude &&
    distance(
      point([i1.longitude, i1.latitude]),
      point([i2.longitude, i2.latitude]),
      { units: "meters" }
    ) < 1
  ) {
    console.log("latlng");
    return 1;
  }

  if (
    !i1.dateCreated &&
    !i1.longitude &&
    Math.abs(comparePHash(i1.blockHash, i2.blockHash)) > 0.7
  ) {
    console.log("phash");
    return 1;
  }

  return 0;
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

  return bmvbhash(imageData, 8);
};

export const calculateImageMeta = async (file) => {
  const [blockHash, exif] = await Promise.all([
    getBlockHash(file),
    getExif(file),
  ]);

  return { ...exif, blockHash, file, url: URL.createObjectURL(file) };
};
