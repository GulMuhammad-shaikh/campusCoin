import React from "react";
import TransactionPage from "../components/TransactionPage";

export default function Income({ student }) {
  return <TransactionPage student={student} type="income" />;
}