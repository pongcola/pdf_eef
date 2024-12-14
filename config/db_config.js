import mysql from "mysql2";

// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password:'',
//     database: 'testdb',
//     connectionLimit:'10',
//     dateStrings: true
//   });

// -------------------- TDCP DBเก่า
// const db = {
//   host: '192.168.2.180',
//   port: '3307',
//   user: 'reportuser',
//   password:'BVcDPQF9CH',
//   database: 'dbreport',
//   connectionLimit:'10',
//   dateStrings: true
// };

// -------------------- TDCP DBใหม่
const db = {
  host: '192.168.2.180',
  port: '3307',
  user: 'tdcpuser',
  password:'YW7zEB73fq',
  database: 'dbtdcp',
  connectionLimit:'10',
  dateStrings: true
};

// const db = { 
//   host: '192.168.1.11',
//   port: '3306',
//   user: 'estudent_superadmin',
//   password: 'n8-tTJ$jFS+ZJu29*K+Zqr=6_bytw=#v',
//   connectionLimit: 10,
//   queueLimit: 0
// }

  
export default db