import React from "react";
import TransactionPage from "../components/TransactionPage";

export default function Expenses({ student }) {
  return <TransactionPage student={student} type="expense" />;
}