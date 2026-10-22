import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 12, color: "#1e293b" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
});

export async function generateSamplePdfBlob(): Promise<Blob> {
  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER", style: styles.page },
      React.createElement(Text, { style: styles.header }, "TrueSquare Invoice")
    )
  );

  return await pdf(doc).toBlob();
}
