import axios from "axios";
import pool from '../config/connect_bangkok.js';

import PDFDocument from 'pdfkit-table';
import fs from 'fs';
import qrcode from 'qrcode';
import { Base64Encode } from 'base64-stream';

import base64Img from 'base64-img';
// import bwipjs from 'bwip-js';


const genQrCode = (RefNo1) => {
    return new Promise((resolve, reject) => {
        const text = RefNo1;
        const outputPath = 'qrCode.png';

        qrcode.toFile(outputPath, text, (error) => {
            if (error) {
                reject(error);
                return;
            }


            const base64Data = base64Img.base64Sync(outputPath);

            fs.unlink(outputPath, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(base64Data);
                }
            });
        });
    });
}


const cov = (u) => {
    const x = u * 2.83;
    return x;
};

const voc = (u) => {
    const x = u / 2.83;
    return x;
};



const run = async (req, res) => {
    const pdfBase64 = await genDoc();
}

const covDateTH = (e) => {
    const date = new Date(e);

    const result = date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    return result
}

const covDate = (e, t) => {
    let dateSp = e.split("/");

    let D = dateSp["0"];
    let M = dateSp["1"];
    let Y = dateSp["2"];
    if (t == "60") {
        Y = parseInt(dateSp[2]) + 60;
    } else {
        Y = dateSp["2"];
    }

    return D + " " + MONTHSSUBDOT[M] + " " + Y;
}

const getData = async (AppID) => {
    let Objs = {}
    try {

        const connection = await pool.getConnection()
        const sqls = `SELECT a.AppID ,a.PlaceSubjectNo,a.PlaceID,a.PlaceName,a.PlaceBuliding,a.PlaceRoom,a.PlaceRoomNo,a.PlaceFloor,a.PlaceTable,a.PlaceRound,a.PlaceRoundName,a.HdPosition,a.Position, b.* FROM bangkok202402_appid_place a INNER JOIN bangkok202402_customer b ON a.RefNo1 = b.RefNo1 WHERE a.AppID = '${AppID}' `
        // console.log(sqls)
        const resMerchant = await connection.query(sqls)
        if (resMerchant.length > 0) {
            Objs['Main'] = resMerchant[0];
        }
        return Objs
    } catch (error) {
        console.log(error)
        return null
    }
}

const expDate = (q) => {
    const sp = q.split("/")
    if (sp.length == 3) {
        return sp
    } else {
        return [0, 0, 0]
    }
}

async function fetchImage(src) {
    const image = await axios
        .get(src, {
            responseType: 'arraybuffer'
        })
    return image.data;
}

var mons = {
    1: "มกราคม",
    2: "กุมภาพันธ์",
    3: "มีนาคม",
    4: "เมษายน",
    5: "พฤษภาคม",
    6: "มิถุนายน",
    7: "กรกฎาคม",
    8: "สิงหาคม",
    9: "กันยายน",
    10: "ตุลาคม",
    11: "พฤศจิกายน",
    12: "ธันวาคม",
    "": "",
}
const covDateNow = () => {
    const dateNows = new Date();
    const getFullYear = dateNows.getFullYear()
    const getMonth = dateNows.getMonth()
    const getDate = dateNows.getDate()
    const getHours = dateNows.getHours()
    const getMinutes = dateNows.getMinutes()
    const getSeconds = dateNows.getSeconds()

    return [getDate, mons[getMonth], (getFullYear + 543), (getDate + " " + mons[getMonth] + " " + (getFullYear + 543) + " เวลา " + getHours + ":" + getMinutes + ":" + getSeconds + " น.")]
}
export const PDF1 = async (req) => {


    // console.log(req)
    try {
        const Bold = 'font/THSarabunNew Bold.ttf';
        const BoldItalic = 'font/THSarabunNew BoldItalic.ttf';
        const Italic = 'font/THSarabunNew Italic.ttf';
        const ThS = 'font/THSarabunNew.ttf';

        const v = req['Main'][0]
        const border = 'ffffff';

        let s = {}

        let doc = new PDFDocument({
            size: 'A4',
            layout: `portrait`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        });

        const Profiles = await fetchImage("https://atc-rta.thaijobjob.com/upload/bangkok/202402/pic/" + v.hiddenFilename)
        doc.image('img/logo_bangkok.png', cov(10), cov(10), { width: cov(25), height: cov(25) })

        doc.image(Profiles, cov(165), cov(10), { width: cov(35), height: cov(42) })


        doc.font(Bold).fontSize(12).fillColor('black');
        s = { "x": 165, "y": 54, "w": 35, "h": 6, "bd": border }
        doc.fillColor("black").text('เลขประจำตัวสอบ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": 165, "y": s['y'] + s['h'], "w": 35, "h": 6, "bd": border }
        doc.fillColor("blue").text(v.AppID, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 163, "y": s['y'] + s['h'] + 2, "w": 37, "h": 6, "bd": border }
        doc.fillColor("black").text("วัน เวลา สถานที่สอบ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

        const PlaceRoundName = v.PlaceRoundName.split(" เวลา ")
        // console.log("PlaceRoundName", PlaceRoundName)
        doc.font(ThS).fontSize(12).fillColor('black');

        s = { "x": 163, "y": s['y'] + s['h'] - 2, "w": 37, "h": 6, "bd": border }
        doc.fillColor("black").text(PlaceRoundName[0], cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

        s = { "x": 163, "y": s['y'] + s['h'] - 2, "w": 37, "h": 6, "bd": border }
        doc.fillColor("black").text("เวลา " + PlaceRoundName[1], cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

        s = { "x": 163, "y": s['y'] + s['h'] - 2, "w": 37, "h": 6, "bd": border }
        doc.fillColor("black").text(v.PlaceName, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });






        doc.font(Bold).fontSize(16).fillColor('black');
        s = { "x": 20, "y": 15, "w": 170, "h": 6, "bd": border }
        doc.text('ใบสมัครสอบเพื่อวัดภาคความรู้ความสามารถทั่วไป', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6, "bd": border }
        doc.text('ด้วยระบบอิเล็กทรอนิกส์ ครั้งที่ 1/2567', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6, "bd": border }
        doc.text("ระดับ " + v.typeProcess, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

        doc.font(ThS).fontSize(12).fillColor('black');
        s = { "x": 10, "y": s['y'] + s['h'] + 6, "w": 48, "h": 6, "bd": border }
        doc.fillColor("black").text('1. ชื่อ - สกุล ตามบัตรประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 98, "h": 6, "bd": border }
        doc.fillColor('blue').text((v.name1 == "อื่น ๆ" ? v.nameAny : v.name1) + v.name2 + " " + v.name3, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 10, "y": s['y'] + s['h'], "w": 12, "h": 6, "bd": border }
        doc.fillColor("black").text('สัญชาติ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 23, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.nationality, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 12, "h": 6, "bd": border }
        doc.fillColor('black').text('ศาสนา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 33, "h": 6, "bd": border }
        doc.fillColor('blue').text((v.religion == "อื่น ๆ" ? v.religionAny : v.religion), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 24, "h": 6, "bd": border }
        doc.fillColor('black').text('วัน เดือน ปี เกิด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 42, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.birthDMY, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        const agesx = v.age.replaceAll("ปี", "-").replaceAll("เดือน", "")
        const ages = agesx.split("-")
        s = { "x": 10, "y": s['y'] + s['h'], "w": 5, "h": 6, "bd": border }
        doc.fillColor("black").text('อายุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6, "bd": border }
        doc.fillColor('blue').text(ages[0], cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 3, "h": 6, "bd": border }
        doc.fillColor('black').text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 12, "h": 6, "bd": border }
        doc.fillColor('blue').text(ages[1], cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 12, "h": 6, "bd": border }
        doc.fillColor('black').text('เดือน เพศ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.gender, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 33, "h": 6, "bd": border }
        doc.fillColor('black').text('เลขบัตรประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 39, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.CustomerID, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()


        doc.font(ThS).fontSize(12).fillColor('black');
        s = { "x": 10, "y": s['y'] + s['h'], "w": 56, "h": 6, "bd": border }
        doc.fillColor("black").text('2. ชื่อ - สกุล ตามคุณวุฒิการศึกษาที่ใช้สมัครสอบ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 90, "h": 6, "bd": border }
        doc.fillColor('blue').text((v.CheckName1 == "อื่น ๆ" ? v.CheckNameAny : v.CheckName1) + v.CheckName2 + " " + v.CheckName3, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 10, "y": s['y'] + s['h'], "w": 79, "h": 6, "bd": border }
        doc.fillColor("black").text('3. ระดับวุฒิการศึกษาที่สมัครสอบเพื่อวัดภาคความรู้ความสามารถทั่วไป', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 67, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.typeProcess.replaceAll(" ", ""), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()

        // if( v.majorType == "อื่น ๆ")
        // v.majorType == "ประกาศนียบัตร ( เช่น ประกาศนียบัตรผู้ช่วยพยาบาล เป็นต้น )" ? "ประกาศนียบัตร" : v.majorType
        // v.typeProcess

        s = { "x": 10, "y": s['y'] + s['h'], "w": 29, "h": 6, "bd": border }
        doc.fillColor("black").text('วุฒิที่ใช้ในการสมัครสอบ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 117, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.majorType, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        if (v.majorType != "ประกาศนียบัตร ( เช่น ประกาศนียบัตรผู้ช่วยพยาบาล เป็นต้น )") {
            s = { "x": 10, "y": s['y'] + s['h'], "w": 15, "h": 6, "bd": border }
            doc.fillColor("black").text(v.typeProcess == "ปวช./ ประกาศนียบัตร/ปวท./ อนุปริญญา/ปวส." ? "ประเภทวิชา" : "ชื่อปริญญา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 131, "h": 6, "bd": border }
            doc.fillColor('blue').text(v.degreeName == "อื่น ๆ" ? v.degreeAny : v.degreeName, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()

            s = { "x": 10, "y": s['y'] + s['h'], "w": 20, "h": 6, "bd": border }
            doc.fillColor("black").text("สาขา / วิชาเอก", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 126, "h": 6, "bd": border }
            doc.fillColor('blue').text(v.major != "อื่น ๆ" ? v.major : v.MajorAny, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        } else {
            s = { "x": 10, "y": s['y'] + s['h'], "w": 20, "h": 6, "bd": border }
            doc.fillColor("black").text("ชื่อประกาศนียบัตร", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 126, "h": 6, "bd": border }
            doc.fillColor('blue').text(v.diploma == "อื่น ๆ" ? v.diplomaAny : v.diploma, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        }

        s = { "x": 10, "y": s['y'] + s['h'], "w": 36, "h": 6, "bd": border }
        doc.fillColor("black").text("ได้รับการอนุมัติจากสถานศึกษา", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 110, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.school, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 10, "y": s['y'] + s['h'], "w": 24, "h": 6, "bd": border }
        doc.fillColor('black').text('ประเภทสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 23, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.typeSchool, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6, "bd": border }
        doc.fillColor('black').text('ที่ตั้งสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 31, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.areaSchool, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 34, "h": 6, "bd": border }
        doc.fillColor('black').text('ปีการศึกษาที่สำเร็จการศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 61, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.endEducation, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 10, "y": s['y'] + s['h'], "w": 22, "h": 6, "bd": border }
        doc.fillColor('black').text('คะแนนเฉลี่ยสะสม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 35, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.GPA, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()


        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6, "bd": border }
        doc.fillColor('black').text('วุฒิการศึกษาสูงสุด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 67, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.highEducation, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 10, "y": s['y'] + s['h'], "w": 12, "h": 6, "bd": border }
        doc.fillColor('black').text('4. ข้าพเจ้า', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 35, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.deformed + "ความพิการ", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()

        if (v.deformed == "มี") {
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 27, "h": 6, "bd": border }
            doc.fillColor('black').text('ประเภทของความพิการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 62, "h": 6, "bd": border }
            doc.fillColor('blue').text(v.typeDeformed, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()

            if (v.helpDeformed == "ต้องการ") {
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6, "bd": border }
                doc.fillColor('black').text('ข้าพเจ้า', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
                s = { "x": s['x'] + s['w'], "y": s['y'], "w": 45, "h": 6, "bd": border }
                doc.fillColor('blue').text("ต้องการ " + v.helpDetial, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
                doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
            }
        }


        s = { "x": 10, "y": s['y'] + s['h'], "w": 20, "h": 6, "bd": border }
        doc.fillColor('black').text('5. อาชีพปัจจุบัน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 126, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.job == "อื่น ๆ" ? v.jobAny : v.job, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 10, "y": s['y'] + s['h'], "w": 18, "h": 6, "bd": border }
        doc.fillColor('black').text('สถานที่ทำางาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.jobArea == "" ? "-" : v.jobArea, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6, "bd": border }
        doc.fillColor('black').text('กอง / สำนัก / อื่นๆ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 78, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.jobSubArea, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 10, "y": s['y'] + s['h'], "w": 11, "h": 6, "bd": border }
        doc.fillColor('black').text('ตำแหน่ง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 117, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.jobPosition, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6, "bd": border }
        doc.fillColor('black').text('อัตราเงินเดือน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.jobSalary, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6, "bd": border }
        doc.fillColor('black').text('บาท', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        s = { "x": 10, "y": s['y'] + s['h'], "w": 36, "h": 6, "bd": border }
        doc.fillColor('black').text('6. ที่อยู่ที่สามารถติดต่อได้ เลขที่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 36, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.address, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 14, "h": 6, "bd": border }
        doc.fillColor('black').text('อาคาร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.building != "" ? v.building : "-", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 5, "h": 6, "bd": border }
        doc.fillColor('black').text('หมู่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.moo != "" ? v.moo : "-", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 10, "y": s['y'] + s['h'], "w": 14, "h": 6, "bd": border }
        doc.fillColor('black').text('ตรอก/ซอย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 85.5, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.soi != "" ? v.soi : "-", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 6, "h": 6, "bd": border }
        doc.fillColor('black').text('ถนน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 85.5, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.road != "" ? v.road : "-", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 10, "y": s['y'] + s['h'], "w": 8, "h": 6, "bd": border }
        doc.fillColor('black').text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 55, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.district, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6, "bd": border }
        doc.fillColor('black').text('อำเภอ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 55, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.amphur, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6, "bd": border }
        doc.fillColor('black').text('จังหวัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 56, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.province, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 10, "y": s['y'] + s['h'], "w": 15, "h": 6, "bd": border }
        doc.fillColor('black').text('รหัสไปรษณีย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.zipcode, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 16, "h": 6, "bd": border }
        doc.fillColor('black').text('เบอร์โทรศัพท์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 35, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.phone, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6, "bd": border }
        doc.fillColor('black').text('E-mail', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 90, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.email, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 10, "y": s['y'] + s['h'], "w": 35, "h": 6, "bd": border }
        doc.fillColor('black').text('7. ที่อยู่ตามทะเบียนบ้าน เลขที่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 37, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.address1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 14, "h": 6, "bd": border }
        doc.fillColor('black').text('อาคาร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.building1 != "" ? v.building1 : "-", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 5, "h": 6, "bd": border }
        doc.fillColor('black').text('หมู่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.moo1 != "" ? v.moo1 : "-", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 10, "y": s['y'] + s['h'], "w": 14, "h": 6, "bd": border }
        doc.fillColor('black').text('ตรอก/ซอย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 85.5, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.soi1 != "" ? v.soi1 : "-", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 6, "h": 6, "bd": border }
        doc.fillColor('black').text('ถนน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 85.5, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.road1 != "" ? v.road1 : "-", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 10, "y": s['y'] + s['h'], "w": 8, "h": 6, "bd": border }
        doc.fillColor('black').text('ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 55, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.district1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6, "bd": border }
        doc.fillColor('black').text('อำเภอ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 55, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.amphur1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6, "bd": border }
        doc.fillColor('black').text('จังหวัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 56, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.province1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 10, "y": s['y'] + s['h'], "w": 15, "h": 6, "bd": border }
        doc.fillColor('black').text('รหัสไปรษณีย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.zipcode1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 10, "y": s['y'] + s['h'], "w": 30, "h": 6, "bd": border }
        doc.fillColor('black').text('8. บุคคลที่สามารถติดต่อได้', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 90, "h": 6, "bd": border }
        doc.fillColor('blue').text((v.callName1 == "อื่น ๆ" ? v.callNameAny : v.callName1) + v.callName2 + " " + v.callName3, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6, "bd": border }
        doc.fillColor('black').text('เกี่ยวข้องเป็น', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 55, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.relationship, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 10, "y": s['y'] + s['h'], "w": 11, "h": 6, "bd": border }
        doc.fillColor('black').text('โทรศัพท์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6, "bd": border }
        doc.fillColor('blue').text(v.callPhone, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 10, "y": s['y'] + s['h'] + 6, "w": 191, "h": 6, "bd": border }
        doc.lineJoin('miter').rect(cov(s['x']), cov(s['y']), cov(5), cov(5)).undash().stroke();
        doc.image('img/check.png', cov(s['x']), cov(s['y']), { width: cov(5), height: cov(5) })
        doc.fillColor('black').text('          ข้าพเจ้าขอให้คำรับรองและแสดงความยินยอมตามเงื่อนไขทุกประการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.51 });

        s = { "x": 10, "y": s['y'] + s['h'], "w": 191, "h": 6, "bd": border }
        doc.fillColor('black').text('          1. ข้าพเจ้าขอให้คำรับรองว่า ข้อความดังกล่าวข้างต้นนี้เป็นจริงทุกประการและข้าพเจ้ามีคุณสมบัติทั่วไปและไม่มีลักษณะต้องห้ามตามมาตรา 43', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.51 });

        s = { "x": 10, "y": s['y'] + s['h'], "w": 191, "h": 6, "bd": border }
        doc.fillColor('black').text('แห่งพระราชบัญญัติระเบียบข้าราชการกรุงเทพมหานครและบุคลากรกรุงเทพมหานคร พ.ศ. 2554 และมีคุณสมบัติตรงตามประกาศรับสมัคร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.2 });

        s = { "x": 10, "y": s['y'] + s['h'], "w": 191, "h": 6, "bd": border }
        doc.fillColor('black').text('          2. หากมีการตรวจสอบหลักฐานและเอกสารและหรือคุณวุฒิการศึกษาของข้าพเจ้าในภายหลัง ปรากฏว่าข้าพเจ้ามีคุณสมบัติไม่ตรงตามประกาศรับสมัครสอบ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.24 });
        s = { "x": 10, "y": s['y'] + s['h'], "w": 191, "h": 6, "bd": border }
        doc.fillColor('black').text('ให้ถือว่าข้าพเจ้าเป็นผู้ขาดคุณสมบัติในการสมัครสอบครั้งนี้มาตั้งแต่ต้น และไม่มีสิทธิได้รับหนังสือรับรองผลการสอบผ่านการวัดภาคความรู้ความสามารถทั่วไปของกรุงเทพมหานคร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: -0.07 });
        s = { "x": 10, "y": s['y'] + s['h'], "w": 191, "h": 6, "bd": border }
        doc.fillColor('black').text('และกรณีข้าพเจ้าจงใจกรอกข้อความอันเป็นเท็จ อาจมีความผิดทางอาญาฐานแจ้งความเท็จต่อเจ้าพนักงานตามประมวลกฎหมายอาญามาตรา 137', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 10, "y": s['y'] + s['h'], "w": 191, "h": 6, "bd": border }
        doc.fillColor('black').text('          3. ข้าพเจ้าได้ศึกษาและทำความเข้าใจพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ตลอดจนประกาศและระเบียบที่เกี่ยวข้องโดยละเอียดครบถ้วนแล้ว', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
        s = { "x": 10, "y": s['y'] + s['h'], "w": 191, "h": 6, "bd": border }
        doc.fillColor('black').text('ข้าพเจ้าขอแสดงความยินยอมให้หน่วยงานหรือบุคคลที่เกี่ยวข้องกับการดำเนินการสรรหา สามารถเก็บ รวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลรวมถึงภาพถ่ายและวีดีโอ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.11 });
        s = { "x": 10, "y": s['y'] + s['h'], "w": 191, "h": 6, "bd": border }
        doc.fillColor('black').text('ที่เกี่ยวข้องกับข้าพเจ้า เพื่อประโยชน์ของทางราชการตามกฎหมายที่เกี่ยวข้อง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.14 });



        s = { "x": 115, "y": s['y'] + s['h'] + 10, "w": 8, "h": 6, "bd": border }
        doc.fillColor('black').text('ลงชื่อ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 52, "h": 6, "bd": border }
        doc.fillColor('blue').text("", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 115, "y": s['y'] + s['h'], "w": 1, "h": 6.5, "bd": border }
        doc.fillColor('black').text('(', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 63, "h": 6, "bd": border }
        doc.fillColor('blue').text((v.name1 == "อื่น ๆ" ? v.nameAny : v.name1) + v.name2 + " " + v.name3, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1.5)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1.5)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 1, "h": 6, "bd": border }
        doc.fillColor('black').text(')', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.17 });


        const spDx = v.DateTime.split(" ")
        const cDate = spDx[0].split("-")
        s = { "x": 107, "y": s['y'] + s['h'] + 3, "w": 8, "h": 6.5, "bd": border }
        doc.fillColor("black").text('วันที่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(parseInt(cDate[2]), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.fillColor('black').text("เดือน", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(mons[parseInt(cDate[1])], cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.fillColor('black').text("พ.ศ.", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(parseInt(cDate[0]) + 543, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        const bsQrcode = await genQrCode(v.AppID)

        doc.image(bsQrcode, cov(10), cov(260), {
            fit: [cov(30), cov(30)],
        });
        // const qrCodeData = v.AppID; // Replace this with your QR code data

        // // Generate QR code using qrcode library
        // QRCode.toFileStream(doc, qrCodeData, {
        //     type: 'pdf',
        //     errorCorrectionLevel: 'H',
        // });
        // // const outputStream = fs.createWriteStream(outputFilename);

        // console.log(outputStream)

        doc.rect(cov(161.5), cov(68), cov(40), cov(18)).stroke();

        doc.end();


        let finalString = '';
        let stream = doc.pipe(new Base64Encode());

        stream.on('data', function (chunk) {
            finalString += chunk;
        });

        const base64 = await new Promise((resolve, reject) => {
            stream.on('end', () => {
                resolve(finalString)
            })
        })

        return base64

    } catch (error) {
        console.log(error)
        return null
    }
};


export const Bangkok202402 = async (req, res) => {
    // console.log(">><<")

    const AppID = req.params.AppID
    const data = await getData(AppID);
    // console.log(data)
    const pdfBase64 = await PDF1(data);
    // res.send("<iframe width='100%' height='100%' src='data:application/pdf;base64," + pdfBase64 + "'></iframe>")
    res.send("data:application/pdf;base64," + pdfBase64)
}


// export const PdfSp1 = async (req, res) => {
// console.log("xxxxxxxxxxxxxxxxxx", req.body)
//     const pdfBase64 = await PDF(req.body);
//     res.send("data:application/pdf;base64," + pdfBase64 + "")
// }

