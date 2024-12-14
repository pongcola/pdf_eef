import axios from 'axios';
import url from 'url';
import { getReceiptNo, updateReceiptNo } from './receiptNo.js'

export const transaction = async (connection, callback) => {
  connection.query("START TRANSACTION");
  try {
    const result = await callback();
    connection.commit();
    return result
  } catch (err) {
    connection.rollback();
    console.error("TRANSACTION SERVICE:", err)
    throw err
  }
}


export const createTellerPayment = async (form, connection, database) => {
  try {
    const result = await connection.query(`INSERT INTO ${database}.tellerpayments (CompanyCode, TextFile, BankCode, AccountNumber, TransDate, TransTime, CustomerName, RefNo1, TermBranch, TellerID, CreditDebit, Type, ChequeNo, Amount, ChqBankCode) VALUES ?`, [form])
    return result
  } catch (e) {
    console.log(e)
  }

}

export const updateTaxFormStatus = async (form, connection, database) => {
  const failedRefs = [];
  let success = 0;
  for (const f of form) {
    await transaction(connection, async () => {
      const TransDate = f[4]
      const TransTime = f[5]
      const registrationCode = f[7].slice(0, -1)
      const change = Number(f[13].substring(0, 5));
      const decimal = f[13].substring(5);
      const amount = `${change}.${decimal}`
      let citizenId = f[14];
      let count = 0;
      for (let index = 0; index < citizenId.length; index += 1) {
        if (citizenId[index] !== '0') {
          break;
        }
        count += 1;
      }

      if (count !== 0) {
        citizenId = citizenId.slice(count, citizenId.length);
      }
      const date = `${TransDate.slice(0, 4)}-${TransDate.slice(4, 6)}-${TransDate.slice(6, 8)}`
      const time = `${TransTime.slice(0, 2)}:${TransTime.slice(2, 4)}:${TransTime.slice(4, 6)}`
      const [[refId]] = await connection.query(`SELECT refReceiptId, refReceiptId2 FROM ${database}.vEnrolls WHERE enrollRef = ? AND citizenId = ?`, [registrationCode, citizenId]);
      const [[student]] = await connection.query(`SELECT id FROM ${database}.students WHERE citizen_id = ?`, citizenId);
      if (refId && student.id) {
        const receiptNo = await getReceiptNo(connection, refId.refReceiptId, refId.refReceiptId2, database);
        const [result] = await connection.query(`UPDATE ${database}.enrolls SET payment_status = '-', pay_date = ?, receipt_ref = ?, receipt_ref2 = ?, amount = ? WHERE refs_no = ? AND payment_status = '*' AND student_id = ?`, [
          `${date} ${time}`,
          receiptNo.ref1,
          receiptNo.ref2,
          amount,
          registrationCode,
          student.id
        ]);

        if (result.affectedRows === 1) {
          success += 1;
          await updateReceiptNo(connection, refId.refReceiptId, refId.refReceiptId2, database);
        }

        if (result.affectedRows === 0) {
          failedRefs.push([registrationCode, citizenId, `${date} ${time}`, 'มีการชำระเงินซ้ำ']);
        }
      } else {
        failedRefs.push([registrationCode, citizenId, `${date} ${time}`, 'เลข ref1 หรือ รหัสบัตรประชาชนไม่ตรงกับในระบบ']);
      }
    })
  }

  if (failedRefs.length !== 0) {
    await connection.query(`INSERT INTO ${database}.invalid_tellers(ref_no, citizen_id, pay_date, note) VALUES ?`, [failedRefs]);
  }

  await lineNoti(success, failedRefs, database);
}

const lineNoti = async (successCount ,failedRefs, database) => {
  const token = 'YYsStGqdyfgPqsh5RTqAPu71lXvBTgBeQHWrTIUGwHP';

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Bearer ${token}`,
  };

  const message = ` ${database.split('_')[1]}\nจำนวนใบชำระที่ update สถานะการจ่ายเงินสำเร็จ ${successCount}\nจำนวนใบชำระที่ update สถานะการจ่ายเงินล้มเหลว ${failedRefs.length}`;

  await axios.post(
    'https://notify-api.line.me/api/notify',
    new url.URLSearchParams({
      message: message,
    }).toString(),
    {
      headers,
    },
  );
}