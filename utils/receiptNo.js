export const getReceiptNo = async (connection, refId, refId2, database) => {
  const [[ref1]] = await connection.query(`SELECT prefix, running FROM ${database}.ref_receipts WHERE id = ? FOR UPDATE`, refId);
  let ref2 = 0;
  if (refId2 !== null) {
    [[ref2]] = await connection.query(`SELECT prefix, running FROM ${database}.ref_receipts WHERE id = ? FOR UPDATE`, refId2);
  }

  return {
    ref1: `${ref1.prefix}${ref1.running}`,
    ref2: refId2 !== null ? `${ref2.prefix}${ref2.running}` : null
  }
}

export const updateReceiptNo = async (connection, refId, refId2, database) => {
  await connection.query(`UPDATE ${database}.ref_receipts SET running = running + 1 WHERE id = ?`, [refId]);
  if (refId2) {
    await connection.query(`UPDATE ${database}.ref_receipts SET running = running + 1 WHERE id = ?`, [refId2]);
  }
}