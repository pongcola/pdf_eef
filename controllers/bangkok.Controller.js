import axios from "axios";
import mysql from "mysql2";
import pool from '../config/connect_bangkok.js';

import PDFDocument from 'pdfkit-table';
import thmaker from 'pdfmake-thaifont-2';
import { Base64Encode } from 'base64-stream';

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
        const sqls = `SELECT a.AppID , b.* FROM bangkok2024032_appid a INNER JOIN bangkok2024032_customer b ON a.RefNo1 = b.RefNo1 WHERE a.AppID = '${AppID}' `
        const resMerchant = await connection.query(sqls)
        // console.log("sqls : ", sqls)
        // console.log("resMerchant : ", resMerchant[0])
        if (resMerchant.length > 0) {
            Objs['Main'] = resMerchant[0];
        }
        return Objs
    } catch (error) {
        // console.log(error)
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
        // console.log(">>>>>", v)
        const Profiles = await fetchImage("https://atc-rta.thaijobjob.com/upload/bangkok/2024032/pic/" + v.hiddenFilename)
        doc.image('img/logo_bangkok.png', cov(92.5), cov(20), { width: cov(25), height: cov(25) })

        doc.image(Profiles, cov(165), cov(10), { width: cov(25), height: cov(32) })



        doc.font(ThS).fontSize(12).fillColor('black');
        s = { "x": 20, "y": 280, "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('เลขประจำตัวสอบ : ' + v.AppID + " พิมพ์ใบสมัคร เมื่อ " + covDateNow()[3], cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'right' });

        doc.font(ThS).fontSize(16).fillColor('black');
        s = { "x": 20, "y": 20, "w": 28, "h": 6.5, "bd": border }
        doc.fillColor("black").text('เลขประจำตัวสอบ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.AppID, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()



        doc.font(Bold).fontSize(16).fillColor('black');
        s = { "x": 20, "y": 50, "w": 170, "h": 6.5, "bd": border }
        doc.text('ใบสมัครคัดเลือกผู้สำเร็จการศึกษาหลักสูตรของสำนักงานคณะกรรมการการอาชีวศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.text('ตามโครงการความร่วมมือคัดเลือกกำลังคนอาชีวศึกษาเพื่อบรรจุและแต่งตั้งบุคคลเข้ารับราชการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.text('เป็นข้าราชการกรุงเทพมหานครสามัญ ครั้งที่ 1/2567', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

        s = { "x": 42, "y": s['y'] + s['h'], "w": 26, "h": 6.5, "bd": border }
        doc.fillColor("black").text('ตำแหน่งที่สมัคร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 100, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.Position, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()


        doc.font(ThS).fontSize(16).fillColor('black');
        s = { "x": 20, "y": s['y'] + s['h'] + 3, "w": 63, "h": 6.5, "bd": border }
        doc.fillColor("black").text('1. ชื่อ - สกุล ตามบัตรประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 82, "h": 6.5, "bd": border }
        doc.fillColor('blue').text((v.name1 == "อื่น ๆ" ? v.nameAny : v.name1) + v.name2 + " " + v.name3, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 8, "h": 6.5, "bd": border }
        doc.fillColor('black').text('เพศ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 17, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.gender, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 17, "h": 6.5, "bd": border }
        doc.fillColor("black").text('    สัญชาติ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.nationality, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 12, "h": 6.5, "bd": border }
        doc.fillColor('black').text('ศาสนา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.fillColor('blue').text((v.religion == "อื่น ๆ" ? v.religionAny : v.religion), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 14, "h": 6.5, "bd": border }
        doc.fillColor('black').text('เกิดวันที่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 12, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(parseInt(expDate(v.birthDMY)[0]), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 11, "h": 6.5, "bd": border }
        doc.fillColor('black').text('เดือน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(mons[parseInt(expDate(v.birthDMY)[1])], cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 9, "h": 6.5, "bd": border }
        doc.fillColor('black').text('พ.ศ.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 17, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(expDate(v.birthDMY)[2], cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 14, "h": 6.5, "bd": border }
        doc.fillColor('black').text('    (อายุ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.age.split(" ")[0], cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 5, "h": 6.5, "bd": border }
        doc.fillColor('black').text('ปี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.age.split(" ")[2], cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 10, "h": 6.5, "bd": border }
        doc.fillColor('black').text('เดือน)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 42, "h": 6.5, "bd": border }
        doc.text('เลขบัตรประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 48, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.CustomerID, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()


        doc.font(ThS).fontSize(16).fillColor('black');
        s = { "x": 20, "y": s['y'] + s['h'], "w": 78, "h": 6.5, "bd": border }
        doc.fillColor("black").text('2. ชื่อ - สกุล ตามคุณวุฒิการศึกษาที่ใช้สมัครคัดเลือก', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 92, "h": 6.5, "bd": border }
        doc.fillColor('blue').text((v.CheckName1 == "อื่น ๆ" ? v.CheckNameAny : v.CheckName1) + v.CheckName2 + " " + v.CheckName3, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 57, "h": 6.5, "bd": border }
        doc.fillColor("black").text('3. คุณวุฒิการศึกษาที่ใช้สมัครคัดเลือก', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.majorType, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 28, "h": 6.5, "bd": border }
        doc.fillColor('black').text('    ชื่อสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 142, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.school, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 33, "h": 6.5, "bd": border }
        doc.fillColor('black').text('    จังหวัดสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 52, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.schoolProvince, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.fillColor('black').text('ประเภทสถานศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.typeSchool, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 25, "h": 6.5, "bd": border }
        doc.fillColor('black').text('    ประเภทวิชา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.degreeName == "อื่น ๆ" ? v.degreeAny : v.degreeName, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.fillColor('black').text('สาขาวิชา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.major == "อื่น ๆ" ? v.MajorAny : v.major, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 20, "h": 6.5, "bd": border }
        doc.fillColor('black').text('    สาขางาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 65, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.MajorWork, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 17, "h": 6.5, "bd": border }
        doc.fillColor('black').text('ปีการศึกษา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.schoolYear, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 24, "h": 6.5, "bd": border }
        doc.fillColor('black').text('สำเร็จการศึกษาเมื่อ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 26, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.schoolDate, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 33, "h": 6.5, "bd": border }
        doc.fillColor('black').text('    คะแนนเฉลี่ยสะสม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.GPA, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.fillColor('black').text('วุฒิการศึกษาสูงสุด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 92, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.highEducation, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        doc.font(ThS).fontSize(16).fillColor('black');
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('4. ข้อมูลความพิการ               ไม่มีความพิการ               มีความพิการ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

        doc.lineJoin('miter').rect(cov(s['x'] + 40), cov(s['y']), cov(5), cov(5)).undash().stroke();
        doc.lineJoin('miter').rect(cov(s['x'] + 82), cov(s['y']), cov(5), cov(5)).undash().stroke();
        if (v.deformed == "ไม่มี") {
            doc.image('img/check.png', cov(s['x'] + 40), cov(s['y']), { width: cov(5), height: cov(5) })
        } else {
            doc.image('img/check.png', cov(s['x'] + 82), cov(s['y']), { width: cov(5), height: cov(5) })
        }
        let jobs = []

        if (v.JobChk0 != null) {
            jobs.push(v.JobChk0)
        }
        if (v.JobChk1 != null) {
            jobs.push(v.JobChk1)
        }
        if (v.JobChk2 != null) {
            jobs.push(v.JobChk2)
        }
        if (v.JobChk3 != null) {
            jobs.push(v.JobChk3)
        }
        if (v.JobChk4 != null) {
            jobs.push(v.JobChk4)
        }
        if (v.JobChk5 != null) {
            jobs.push(v.JobChk5)
        }
        if (v.JobChk6 != null) {
            jobs.push(v.JobChk6)
        }
        if (v.JobChk7 != null) {
            jobs.push(v.JobChk7)
        }
        if (v.JobChk8 != null) {
            jobs.push(v.JobChk8)
        }
        if (v.JobChk9 != null) {
            jobs.push(v.JobChk9)
        }
        if (v.JobChk10 != null) {
            jobs.push(v.JobAny)
        }

        s = { "x": 20, "y": s['y'] + s['h'], "w": 53, "h": 6.5, "bd": border }
        doc.fillColor('black').text('5. ข้อมูลการทำงาน อาชีพปัจจุบัน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 117, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(jobs.join(","), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 28, "h": 6.5, "bd": border }
        doc.fillColor('black').text('    สถานที่ทำงาน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 142, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.JobArea, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 40, "h": 6.5, "bd": border }
        doc.fillColor('black').text('    กอง/สำนัก/แผนก/อื่นๆ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 130, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.jobSubArea, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 18, "h": 6.5, "bd": border }
        doc.fillColor('black').text('    ตำแหน่ง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 102, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.jobPosition, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        doc.fillColor('black').text('อัตราเงินเดือน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.jobSalary, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 55, "h": 6.5, "bd": border }
        doc.fillColor('black').text('6. ที่อยู่ผู้สมัคร ณ ปัจจุบัน บ้านเลขที่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.address, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        doc.fillColor('black').text('หมู่บ้าน/อาคาร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.building, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 25, "h": 6.5, "bd": border }
        doc.fillColor('black').text('    ประเภทที่อยู่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.type_address, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 12, "h": 6.5, "bd": border }
        doc.fillColor('black').text('หมู่ที่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.moo, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
        doc.fillColor('black').text('ตรอก/ซอย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.soi, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
        doc.fillColor('black').text('    ถนน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 78, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.road, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 19, "h": 6.5, "bd": border }
        doc.fillColor('black').text('แขวง/ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 62, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.district, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": 20, "y": s['y'] + s['h'], "w": 25, "h": 6.5, "bd": border }
        doc.fillColor('black').text('    เขต/อำเภอ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 45, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.amphur, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 13, "h": 6.5, "bd": border }
        doc.fillColor('black').text('จังหวัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 45, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.province, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 21, "h": 6.5, "bd": border }
        doc.fillColor('black').text('รหัสไปรษณีย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.zipcode, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 39, "h": 6.5, "bd": border }
        doc.fillColor('black').text('    เบอร์โทรศัพท์ (มือถือ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 28, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.phone, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 12, "h": 6.5, "bd": border }
        doc.fillColor('black').text('E-mail', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 92, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.email, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 55, "h": 6.5, "bd": border }
        doc.fillColor('black').text('7. ที่อยู่ตามทะเบียนบ้าน บ้านเลขที่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.address1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        // s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        doc.fillColor('black').text('หมู่บ้าน/อาคาร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.building1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 25, "h": 6.5, "bd": border }
        doc.fillColor('black').text('    ประเภทที่อยู่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 25, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.type_address1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 12, "h": 6.5, "bd": border }
        doc.fillColor('black').text('หมู่ที่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.moo1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 18, "h": 6.5, "bd": border }
        doc.fillColor('black').text('ตรอก/ซอย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.soi1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": 20, "y": s['y'] + s['h'], "w": 12, "h": 6.5, "bd": border }
        doc.fillColor('black').text('    ถนน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 78, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.road1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 19, "h": 6.5, "bd": border }
        doc.fillColor('black').text('แขวง/ตำบล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 62, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.district1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": 20, "y": s['y'] + s['h'], "w": 25, "h": 6.5, "bd": border }
        doc.fillColor('black').text('    เขต/อำเภอ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 45, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.amphur1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 13, "h": 6.5, "bd": border }
        doc.fillColor('black').text('จังหวัด', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 45, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.province1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 21, "h": 6.5, "bd": border }
        doc.fillColor('black').text('รหัสไปรษณีย์', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 22, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.zipcode1, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 62, "h": 6.5, "bd": border }
        doc.fillColor('black').text('8. บุคคลที่สามารถติดต่อได้ในกรณีฉุกเฉิน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 80, "h": 6.5, "bd": border }
        doc.fillColor('blue').text((v.callName1 == "อื่น ๆ" ? v.callNameAny : v.callName1) + v.callName2 + " " + v.callName3, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": 20, "y": s['y'] + s['h'], "w": 26, "h": 6.5, "bd": border }
        doc.fillColor('black').text('    เกี่ยวข้องเป็น', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 55, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.relationship, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 35, "h": 6.5, "bd": border }
        doc.fillColor('black').text('เบอร์โทรศัพท์ (มือถือ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 55, "h": 6.5, "bd": border }
        doc.fillColor('blue').text((v.callPhone), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()


        s = { "x": 20, "y": s['y'] + s['h'], "w": 77, "h": 6.5, "bd": border }
        doc.fillColor('black').text('    บุคคลที่สามารถติดต่อได้ในกรณีฉุกเฉิน (เพิ่มเติม)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 80, "h": 6.5, "bd": border }
        doc.fillColor('blue').text((v.callNameTwo1 == "อื่น ๆ" ? v.callNameTwoAny : v.callNameTwo1) + v.callNameTwo2 + " " + v.callNameTwo3, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": 20, "y": s['y'] + s['h'], "w": 26, "h": 6.5, "bd": border }
        doc.fillColor('black').text('    เกี่ยวข้องเป็น', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 55, "h": 6.5, "bd": border }
        doc.fillColor('blue').text(v.relationshipTwo, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()

        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 35, "h": 6.5, "bd": border }
        doc.fillColor('black').text('เบอร์โทรศัพท์ (มือถือ)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 55, "h": 6.5, "bd": border }
        doc.fillColor('blue').text((v.callPhoneTwo), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()


        doc.addPage({
            size: 'A4',
            layout: `portrait`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        })

        doc.font(ThS).fontSize(12).fillColor('black');
        s = { "x": 20, "y": 280, "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('เลขประจำตัวสอบ : ' + v.AppID + " พิมพ์ใบสมัคร เมื่อ " + covDateNow()[3], cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'right' });


        doc.font(Bold).fontSize(16).fillColor('black');
        s = { "x": 30, "y": 20, "w": 63, "h": 6.5, "bd": border }
        doc.fillColor("black").text('      ข้าพเจ้าขอให้คำรับรอง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });


        doc.lineJoin('miter').rect(cov(s['x']), cov(s['y']), cov(5), cov(5)).undash().stroke();
        doc.image('img/check.png', cov(s['x']), cov(s['y']), { width: cov(5), height: cov(5) })


        doc.font(ThS).fontSize(16).fillColor('black');
        s = { "x": 30, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
        doc.fillColor("black").text('1. ข้าพเจ้าให้คำรับรองว่า ข้อความดังกล่าวข้างต้นนี้เป็นจริงทุกประการและข้าพเจ้ามีคุณสมบัติทั่วไปและไม่มี', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.02 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('ลักษณะต้องห้ามตามมาตรา 43 แห่งพระราชบัญญัติระเบียบข้าราชการกรุงเทพมหานครและบุคลากรกรุงเทพมหานคร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: -0.09 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('พ.ศ. 2554 และมีคุณสมบัติตรงตามประกาศรับสมัคร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });

        s = { "x": 30, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
        doc.fillColor("black").text('2. ข้าพเจ้าจะยื่นหลักฐานและเอกสารที่แสดงว่าเป็นผู้มีคุณสมบัติทั่วไปและมีคุณสมบัติเฉพาะสำหรับตำแหน่ง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.02 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('ที่สมัครคัดเลือกตรงตามประกาศรับสมัครคัดเลือกภายในระยะเวลาที่กำหนดตามประกาศฯ และรับทราบว่าการส่ง ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('ใบสมัครคัดเลือกพร้อมเอกสารนี้ยังไม่ได้รับการตรวจสอบคุณสมบัติตามหลักเกณฑ์ ประกาศรับสมัครคัดเลือก', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.317 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('และเงื่อนไขต่าง ๆ โดยจะได้รับการตรวจสอบคุณสมบัติเมื่อเป็นผู้สอบผ่านการทดสอบความรู้ความสามารถ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.43 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('ทักษะและสมรรถนะที่จำเป็นในการปฏิบัติงานแล้ว', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        s = { "x": 30, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
        doc.fillColor("black").text('3. ข้าพเจ้าได้ศึกษาและทำความเข้าใจพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ตลอดจนประกาศ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('และระเบียบที่เกี่ยวข้องโดยละเอียดครบถ้วนแล้ว ข้าพเจ้าขอแสดงความยินยอมให้หน่วยงานหรือบุคคลที่เกี่ยวข้อง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.1 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('กับการดำเนินการสรรหา สามารถเก็บ รวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลรวมถึงภาพถ่ายและวิดีโอที่เกี่ยวข้อง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('กับข้าพเจ้า เพื่อประโยชน์ของทางราชการตามกฎหมายที่เกี่ยวข้อง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.408 });

        s = { "x": 30, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
        doc.fillColor("black").text('4. หากมีการตรวจสอบหลักฐานและเอกสารหรือคุณวุฒิการศึกษาของข้าพเจ้าในภายหลัง ปรากฏว่าข้าพเจ้า', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.08 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('มีคุณสมบัติไม่ตรงตามประกาศรับสมัครคัดเลือก ให้ถือว่าข้าพเจ้าเป็นผู้ขาดคุณสมบัติในการสมัครคัดเลือกครั้งนี้', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.2 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('มาตั้งแต่ต้น และกรณีข้าพเจ้าจงใจกรอกข้อความอันเป็นเท็จ อาจมีความผิดทางอาญาฐานแจ้งความเท็จต่อ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0.45 });
        s = { "x": 20, "y": s['y'] + s['h'], "w": 170, "h": 6.5, "bd": border }
        doc.fillColor("black").text('เจ้าพนักงานตามประมวลกฎหมายอาญามาตรา 137', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });


        s = { "x": 110, "y": s['y'] + s['h'] + 20, "w": 70, "h": 6.5, "bd": border }
        doc.fillColor("black").text('ลงชื่อ....................................................ผู้สมัคร', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });

        s = { "x": 115, "y": s['y'] + s['h'] + 3, "w": 1, "h": 6.5, "bd": border }
        doc.fillColor("black").text('(', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 58, "h": 6.5, "bd": border }
        doc.fillColor('blue').text((v.name1 == "อื่น ๆ" ? v.nameAny : v.name1) + v.name2 + " " + v.name3, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
        doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 1)).dash(1, { space: 1.5 }).stroke()
        s = { "x": s['x'] + s['w'], "y": s['y'], "w": 1, "h": 6.5, "bd": border }
        doc.text(")", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });



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


export const TestBangkok = async (req, res) => {

    const AppID = req.params.AppID
    console.log("START : ", AppID)
    const data = await getData(AppID);
    const pdfBase64 = await PDF1(data);
    console.log("STOP : ", AppID)
    // res.send("<iframe width='100%' height='100%' src='data:application/pdf;base64," + pdfBase64 + "'></iframe>")
    res.send("data:application/pdf;base64," + pdfBase64)
}


// export const PdfSp1 = async (req, res) => {
// console.log("xxxxxxxxxxxxxxxxxx", req.body)
//     const pdfBase64 = await PDF(req.body);
//     res.send("data:application/pdf;base64," + pdfBase64 + "")
// }

