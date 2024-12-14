import axios from "axios";
import mysql from "mysql2";
import pool from '../config/connect_atc.js';

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
    // console.log(pdfBase64)
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

const getData = async (u_id) => {
    try {
        const connection = await pool.getConnection()
        const sqls = "SELECT a.Name1,a.Name2,a.Name3,a.Position1,a.Position2,a.Position3,a.Position4,b.AppID ,c.Gender, b.CustomerID , x.file_output FROM `atc-rta202310_customer` a INNER JOIN `atc-rta202310_file` x ON a.CustomerID = x.CustomerID  INNER JOIN `atc-rta202310_appid` b ON a.CustomerID = b.CustomerID INNER JOIN `atc-rta202310_pass1` c ON b.AppID = c.AppID  WHERE c.Gender = '" + u_id + "' "
        console.log(sqls)
        const resMerchant = await connection.query(sqls)
        // console.log(resMerchant)
        return resMerchant;

    } catch (error) {
        // console.log(error)
        return false
    }
}

async function fetchImage(src) {
    const image = await axios
        .get(src, {
            responseType: 'arraybuffer'
        })
    return image.data;
}


export const PDF1 = async (req) => {
    const Data = req[0]
    const Logo = await fetchImage("https://atc-rta.thaijobjob.com/upload/atc-rta/202310/Picture1.jpg")
    try {
        const Bold = 'font/THSarabunNew Bold.ttf';
        const BoldItalic = 'font/THSarabunNew BoldItalic.ttf';
        const Italic = 'font/THSarabunNew Italic.ttf';
        const ThS = 'font/THSarabunNew.ttf';


        let s = {};

        const border = 'ffffff';

        let x;
        let y = 0;

        let doc = new PDFDocument({
            size: 'A4',
            layout: `portrait`,
            // layout: `landscape`,
            margins: {
                top: 50,
                bottom: 0,
                left: 72,
                right: 72,
            }
        });
        let chkPage = 0;

        for await (const i of Data) {
            if (chkPage != 0) {
                doc.addPage()
            }

            doc.rect(cov(10), cov(18), cov(190), cov(29)).stroke();

            doc.rect(cov(10), cov(47), cov(190), cov(37)).stroke();

            doc.rect(cov(43), cov(47), cov(157), cov(18)).stroke();
            doc.rect(cov(43), cov(65), cov(70), cov(19)).stroke();


            doc.image(Logo, cov(12), cov(20), { width: cov(25), height: cov(25) })


            s = { "x": 10, "y": 10, "w": 190, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(16).fillColor("black").text('ผู้หญิง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

            s = { "x": 10, "y": s['y'] + s['h'] + 7, "w": 190, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(16).fillColor("black").text('บันทึกผลการทดสอบสมรรถภาพร่างกาย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

            s = { "x": 10, "y": s['y'] + s['h'], "w": 190, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('การสอบคัดเลือกบุคคลเข้าปฏิบัติงานใน ทบ. ประจำปีงบประมาณ 2567', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

            s = { "x": 10, "y": s['y'] + s['h'], "w": 190, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('วันที่ ....................................................', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });


            const UrlImage = await fetchImage("https://atc-rta.thaijobjob.com/upload/atc-rta/202310/pic/" + i.file_output)
            doc.image(UrlImage, cov(12), cov(50), { width: cov(25), height: cov(32) })

            s = { "x": 50, "y": s['y'] + s['h'] + 13, "w": 15, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('ชื่อ-สกุล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 120, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(i.Name1 + i.Name2 + " " + i.Name3, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

            s = { "x": 50, "y": s['y'] + s['h'] + 7, "w": 25, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text('เลขประจำตัวสอบ', cov(s['x']), cov(s['y'] + 3), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 33, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(i.AppID, cov(s['x']), cov(s['y'] + 3), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] + 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] + 1)).dash(1, { space: 1.5 }).stroke()
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 38, "h": 6.5, "bd": border }
            doc.font(Bold).fontSize(14).fillColor('black').text("     เลขประจำตัวประชาชน", cov(s['x']), cov(s['y'] + 3), { width: cov(s['w']), height: cov(s['h']), align: 'left', characterSpacing: 0 });
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
            doc.font(ThS).fontSize(14).fillColor('black').text(i.CustomerID, cov(s['x']), cov(s['y'] + 3), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
            doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] + 1)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] + 1)).dash(1, { space: 1.5 }).stroke()

            s = { "x": 10, "y": s['y'] + s['h'] + 13, "w": 190, "h": 8, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text(i.Gender == "หญิง" ? ' 1. สถานี ดึงข้อ (ไม่จำกัดเวลา) หรือโหนตัว (ผู้รับการทดสอบเลือกอย่างใดอย่างหนึ่งก่อนเริ่มทดสอบ)' : ' 1. สถานี ดึงข้อ (ไม่จำกัดเวลา)', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": 10, "y": s['y'] + s['h'], "w": 30, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(' ดึงข้อ (ครั้ง)', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 8, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 8, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(' ลงชื่อผู้เข้ารับการทดสอบ', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 8, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": 10, "y": s['y'] + s['h'], "w": 30, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(' โหนตัว (วินาที)', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 8, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 8, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(' ลงชื่อกรรมการ ช่องที่ ..............', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 8, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": 10, "y": s['y'] + s['h'], "w": 30, "h": 8, "bd": border }
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('(ตัวเลข)', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'center' }).undash().stroke();

            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('(ตัวอักษร)', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'center' }).undash().stroke();

            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();


            s = { "x": 10, "y": s['y'] + s['h'], "w": 190, "h": 8, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text(i.Gender == "หญิง" ? ' 2. สถานีลุกนั่ง  (ภายในเวลา 2 นาที)' : ' 2. สถานีลุกนั่ง  (ภายในเวลา 30 วินาที)', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": 10, "y": s['y'] + s['h'], "w": 30, "h": 16, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(' จำนวน (ครั้ง)', cov(s['x']), cov(s['y'] + 5), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 16, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 16, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(' ลงชื่อผู้เข้ารับการทดสอบ', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 8, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": 10, "y": s['y'] + s['h'], "w": 30, "h": 8, "bd": border }
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 8, "bd": border }
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 8, "bd": border }
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(' ลงชื่อกรรมการ ช่องที่ ..............', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 8, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": 10, "y": s['y'] + s['h'], "w": 30, "h": 8, "bd": border }
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('(ตัวเลข)', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'center' }).undash().stroke();

            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('(ตัวอักษร)', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'center' }).undash().stroke();

            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();


            s = { "x": 10, "y": s['y'] + s['h'], "w": 190, "h": 8, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text(i.Gender == "หญิง" ? ' 3. สถานีดันพื้น  (ภายในเวลา 2 นาที)' : ' 3. สถานีดันพื้น  (ภายในเวลา 2 นาที)', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": 10, "y": s['y'] + s['h'], "w": 30, "h": 16, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(' จำนวน (ครั้ง)', cov(s['x']), cov(s['y'] + 5), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 16, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 16, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(' ลงชื่อผู้เข้ารับการทดสอบ', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 8, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": 10, "y": s['y'] + s['h'], "w": 30, "h": 8, "bd": border }
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 8, "bd": border }
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 8, "bd": border }
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(' ลงชื่อกรรมการ ช่องที่ ..............', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 8, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": 10, "y": s['y'] + s['h'], "w": 30, "h": 8, "bd": border }
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('(ตัวเลข)', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'center' }).undash().stroke();

            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('(ตัวอักษร)', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'center' }).undash().stroke();

            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();


            s = { "x": 10, "y": s['y'] + s['h'], "w": 190, "h": 8, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text(i.Gender == "หญิง" ? ' 4. สถานีวิ่ง ระยะทาง 1,000 เมตร' : ' 4. สถานีวิ่ง ระยะทาง 1,000 เมตร', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": 10, "y": s['y'] + s['h'], "w": 30, "h": 16, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(' จำนวน (ครั้ง)', cov(s['x']), cov(s['y'] + 5), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 16, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 16, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(' ลงชื่อผู้เข้ารับการทดสอบ', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 8, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": 10, "y": s['y'] + s['h'], "w": 30, "h": 8, "bd": border }
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 8, "bd": border }
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 8, "bd": border }
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(' ลงชื่อกรรมการ ช่องที่ ..............', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 8, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": 10, "y": s['y'] + s['h'], "w": 30, "h": 8, "bd": border }
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('(ตัวเลข)', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'center' }).undash().stroke();

            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('(ตัวอักษร)', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'center' }).undash().stroke();

            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();


            s = { "x": 10, "y": s['y'] + s['h'], "w": 190, "h": 8, "bd": border }
            doc.font(Bold).fontSize(14).fillColor("black").text(i.Gender == "หญิง" ? ' 5. สถานีว่ายน้ำ  ระยะทาง 25 เมตร ' : ' 5. สถานีว่ายน้ำ  ระยะทาง 25 เมตร  ', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": 10, "y": s['y'] + s['h'], "w": 30, "h": 16, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(' จำนวน (ครั้ง)', cov(s['x']), cov(s['y'] + 5), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 16, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 16, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(' ลงชื่อผู้เข้ารับการทดสอบ', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 8, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": 10, "y": s['y'] + s['h'], "w": 30, "h": 8, "bd": border }
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 8, "bd": border }
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 8, "bd": border }
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text(' ลงชื่อกรรมการ ช่องที่ ..............', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 60, "h": 8, "bd": border }
            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": 10, "y": s['y'] + s['h'], "w": 30, "h": 8, "bd": border }
            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('(ตัวเลข)', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'center' }).undash().stroke();

            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": s['x'] + s['w'], "y": s['y'], "w": 30, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('(ตัวอักษร)', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'center' }).undash().stroke();

            doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();



            s = { "x": 100, "y": s['y'] + 10, "w": 60, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ตรวจถูกต้อง', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'left' }).undash().stroke();
            // doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

            s = { "x": 120, "y": s['y'] + s['h'], "w": 60, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('ลงชื่อ พ.อ.......................................................', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'center' }).undash().stroke();

            s = { "x": 100, "y": s['y'] + s['h'], "w": 100, "h": 8, "bd": border }
            doc.font(ThS).fontSize(14).fillColor("black").text('รองประธานคณะอนุกรรมการทดสอบสมรรถภาพร่างกายฯ', cov(s['x']), cov(s['y'] + 1), { width: cov(s['w']), height: cov(s['h']), align: 'center' }).undash().stroke();



            chkPage++
        }

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
    }
};

// export const PDF1 = async (req) => {
//     const Data = req[0]


//     try {
//         const Bold = 'font/THSarabunNew Bold.ttf';
//         const BoldItalic = 'font/THSarabunNew BoldItalic.ttf';
//         const Italic = 'font/THSarabunNew Italic.ttf';
//         const ThS = 'font/THSarabunNew.ttf';


//         let s = {};

//         const border = 'ffffff';

//         let x;
//         let y = 0;

//         let doc = new PDFDocument({
//             size: 'A4',
//             layout: `portrait`,
//             // layout: `landscape`,
//             margins: {
//                 top: 50,
//                 bottom: 0,
//                 left: 72,
//                 right: 72,
//             }
//         });
//         let chkPage = 0;

//         for await (const i of Data) {
//             if (chkPage != 0) {
//                 doc.addPage()
//             }
//             doc.font(Bold).fontSize(16).fillColor('black');

//             doc.rect(cov(180), cov(33), cov(20), cov(10)).stroke();
//             doc.rect(cov(180), cov(43), cov(20), cov(10)).stroke();
//             s = { "x": 180, "y": 33, "w": 20, "h": 6.5, "bd": border }
//             doc.font(Bold).fontSize(12).fillColor("black").text('ห้องสอบ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             s = { "x": 180, "y": 43, "w": 20, "h": 6.5, "bd": border }
//             doc.font(Bold).fontSize(12).fillColor("black").text('ลำดับ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });


//             s = { "x": 10, "y": 10, "w": 190, "h": 6.5, "bd": border }
//             doc.font(Bold).fontSize(16).fillColor("black").text('ใบคะแนนการสัมภาษณ์ บุคคลเข้าปฏิบัติงานใน ทบ. ประจำปีงบประมาณ 2567', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

//             const UrlImage = await fetchImage("https://atc-rta.thaijobjob.com/upload/atc-rta/202310/pic/" + i.file_output)
//             doc.image(UrlImage, cov(10), cov(25), { width: cov(25), height: cov(32) })

//             s = { "x": 40, "y": 29, "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('ชื่อ - สกุล', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 120, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor('black').text(i.Name1 + i.Name2 + " " + i.Name3, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
//             doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

//             s = { "x": 40, "y": s['y'] + s['h'], "w": 33, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('หมายเลขประจำตัวสอบ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 102, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor('black').text(i.AppID, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
//             doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

//             s = { "x": 40, "y": s['y'] + s['h'], "w": 40, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('หมายเลขประจำตัวประชาชน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 95, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor('black').text(i.CustomerID, cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
//             doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

//             let Pox = []
//             if (i.Position1 != '') {
//                 Pox.push(i.Position1)
//             }
//             if (i.Position2 != '') {
//                 Pox.push(i.Position2)
//             }
//             if (i.Position3 != '') {
//                 Pox.push(i.Position3)
//             }
//             if (i.Position4 != '') {
//                 Pox.push(i.Position4)
//             }
//             s = { "x": 40, "y": s['y'] + s['h'], "w": 22, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('ประเภทการสอบ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 113, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor('black').text(Pox.join(), cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
//             doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

//             s = { "x": 10, "y": s['y'] + s['h'] + 10, "w": 15, "h": 26, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('ลำดับ', cov(s['x']), cov(s['y'] + 9.75), { width: cov(s['w']), height: cov(s['h']), align: 'center' }).undash().stroke();
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 26, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('เรื่องที่ทำการสัมภาษณ์ ', cov(s['x']), cov(s['y'] + 9.75), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 26, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('ค่า', cov(s['x']), cov(s['y'] + 6.5), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.font(ThS).fontSize(14).fillColor("black").text('น้ำหนัก', cov(s['x']), cov(s['y'] + 13), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 75, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('ผลการทดสอบ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 26, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('ผล', cov(s['x']), cov(s['y'] + 6.5), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.font(ThS).fontSize(14).fillColor("black").text('คะแนน', cov(s['x']), cov(s['y'] + 13), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();


//             s = { "x": 110, "y": s['y'] + 6.5, "w": 15, "h": 19.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('ดีมาก', cov(s['x']), cov(s['y'] + 3.25), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.font(ThS).fontSize(14).fillColor("black").text('5', cov(s['x']), cov(s['y'] + 9.75), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 19.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('ดี', cov(s['x']), cov(s['y'] + 3.25), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.font(ThS).fontSize(14).fillColor("black").text('4', cov(s['x']), cov(s['y'] + 9.75), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 19.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('พอใช้', cov(s['x']), cov(s['y'] + 3.25), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.font(ThS).fontSize(14).fillColor("black").text('3', cov(s['x']), cov(s['y'] + 9.75), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 19.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('ปรับปรุง', cov(s['x']), cov(s['y'] + 3.25), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.font(ThS).fontSize(14).fillColor("black").text('2', cov(s['x']), cov(s['y'] + 9.75), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 19.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('ไม่', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.font(ThS).fontSize(14).fillColor("black").text('เหมาะสม', cov(s['x']), cov(s['y'] + 6.5), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.font(ThS).fontSize(14).fillColor("black").text('1', cov(s['x']), cov(s['y'] + 13), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();


//             s = { "x": 10, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text(' บุคลิกภาพ สีหน้า ท่าทาง', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

//             s = { "x": 10, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text(' ท่วงที วาจา การแสดงออก (ร้องเพลง)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

//             s = { "x": 10, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text(' วุฒิภาวะทางอารมณ์ การปรับตัว ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

//             s = { "x": 10, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text(' บทบาทหน้าที่พลเมืองตามรัฐธรรมนูญไทย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

//             s = { "x": 10, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text(' ความรู้เกี่ยวกับกองทัพบก ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

//             s = { "x": 10, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text(' สถาบันพระมหากษัตริย์และศาสตร์พระราชา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });

//             s = { "x": 10, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text(' ประวัติศาสตร์ชาติไทย', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('1', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });


//             s = { "x": 10, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('รวม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 105, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();


//             s = { "x": 10, "y": s['y'] + s['h'] + 5, "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('คะแนนรวม', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text(' ผ่าน ..................', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 65, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('ไม่ผ่าน ............. (คะแนนรวมน้อยกว่า 25)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();


//             s = { "x": 10, "y": s['y'] + s['h'] + 5, "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('การประเมินทัศนคติของผู้เข้ารับการสอบด้วยแผ่นภาพ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('ทัศนคติ ผ่าน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 65, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('ทัศนคติ ไม่ผ่าน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();


//             s = { "x": 10, "y": s['y'] + s['h'] + 5, "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('ผลการพิจารณา 1 และ 2', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text(' ผ่าน ..................', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 65, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('ไม่ผ่าน ............. (คะแนนรวมน้อยกว่า 25)', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();


//             s = { "x": 10, "y": s['y'] + s['h'] + 5, "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('3', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('การนับถือศาสนา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('นับถือศาสนา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 65, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('ไม่นับถือศาสนา', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();



//             s = { "x": 10, "y": s['y'] + s['h'], "w": 15, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('4', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 70, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('เหตุผลที่ต้องการเข้ามารับราชการใน ทบ.', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 40, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('ผ่าน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 65, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('ไม่ผ่าน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center' });
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).stroke();

//             s = { "x": 20, "y": s['y'] + s['h'] + 10, "w": 100, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('หมายเหตุ  :  ดูคำแนะนำในการพิจารณาการให้คะแนน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });

//             s = { "x": 20, "y": s['y'] + s['h'], "w": 25, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text('- เหตุผล ที่ไม่ผ่าน', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 135, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor('black').text("", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
//             doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

//             s = { "x": 20, "y": s['y'] + s['h'], "w": 160, "h": 6.5, "bd": border }
//             doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()

//             s = { "x": 40, "y": s['y'] + s['h'] + 10, "w": 10, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text(' ลงชื่อ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor('black').text("", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
//             doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 65, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text(' กรรมการสอบสัมภาษณ์ ชุดที่ ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'right' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 20, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor('black').text("", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
//             doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()




//             s = { "x": 40, "y": s['y'] + s['h'] + 3, "w": 10, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor("black").text(' ', cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'left' });
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 50, "h": 6.5, "bd": border }
//             doc.font(ThS).fontSize(14).fillColor('black').text("(                                             )", cov(s['x']), cov(s['y']), { width: cov(s['w']), height: cov(s['h']), align: 'center', characterSpacing: 0 });
//             doc.moveTo(cov(s['x']), cov(s['y'] + s['h'] - 2)).lineTo(cov(s['x'] + s['w']), cov(s['y'] + s['h'] - 2)).dash(1, { space: 1.5 }).stroke()
//             s = { "x": s['x'] + s['w'], "y": s['y'], "w": 65, "h": 6.5, "bd": border }

//             s = { "x": 10, "y": 91, "w": 15, "h": 45.5, "bd": border }
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).undash().stroke();
//             s = { "x": s['x'] + s['w'], "y": 91, "w": 70, "h": 45.5, "bd": border }
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).undash().stroke();
//             s = { "x": s['x'] + s['w'], "y": 91, "w": 15, "h": 45.5, "bd": border }
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).undash().stroke();
//             s = { "x": s['x'] + s['w'], "y": 91, "w": 15, "h": 45.5, "bd": border }
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).undash().stroke();
//             s = { "x": s['x'] + s['w'], "y": 91, "w": 15, "h": 45.5, "bd": border }
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).undash().stroke();
//             s = { "x": s['x'] + s['w'], "y": 91, "w": 15, "h": 45.5, "bd": border }
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).undash().stroke();
//             s = { "x": s['x'] + s['w'], "y": 91, "w": 15, "h": 45.5, "bd": border }
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).undash().stroke();
//             s = { "x": s['x'] + s['w'], "y": 91, "w": 15, "h": 45.5, "bd": border }
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).undash().stroke();
//             s = { "x": s['x'] + s['w'], "y": 91, "w": 15, "h": 45.5, "bd": border }
//             doc.rect(cov(s['x']), cov(s['y']), cov(s['w']), cov(s['h'])).undash().stroke();
//             chkPage++
//         }

//         doc.end();


//         let finalString = '';
//         let stream = doc.pipe(new Base64Encode());

//         stream.on('data', function (chunk) {
//             finalString += chunk;
//         });

//         const base64 = await new Promise((resolve, reject) => {
//             stream.on('end', () => {
//                 resolve(finalString)
//             })
//         })

//         return base64

//     } catch (error) {
//     }
// };

export const PdfATC = async (req, res) => {
    const u_id = req.params.u_id
    const data = await getData(u_id);
    const pdfBase64 = await PDF1(data);
    // res.send("<iframe width='100%' height='100%' src='data:application/pdf;base64," + pdfBase64 + "'></iframe>")

    res.type('application/pdf');
    res.header('Content-Disposition', `attachment; filename=${encodeURIComponent("atc_ผลการทดสอบสมรรถภาพร่างกาย_" + u_id)}.pdf`);
    res.send(Buffer.from(pdfBase64, 'base64'));
}


// export const Pdf1 = async (req, res) => {
// console.log("xxxxxxxxxxxxxxxxxx", req.body)
//     const pdfBase64 = await PDF(req.body);
//     res.send("data:application/pdf;base64," + pdfBase64 + "")
// }

