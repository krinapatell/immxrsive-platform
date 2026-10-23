import { NextResponse } from 'next/server';
import { pdfToText } from '@/lib/resume/pdf';
// TEMPORARY diagnostic: reads a built-in sample PDF (no user data). Will be removed.
export async function GET() {
  try {
    const t = await pdfToText(new Uint8Array(Buffer.from('JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA0IDAgUiA+PiA+PiAvQ29udGVudHMgNSAwIFIgPj4KZW5kb2JqCjQgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iago1IDAgb2JqCjw8IC9MZW5ndGggMTk2ID4+CnN0cmVhbQpCVAovRjEgMTEgVGYKNzIgNzYwIFRkCihKb3JkYW4gTGVlKSBUagowIC0xNSBUZAooU3R1ZGVudCkgVGoKMCAtMTUgVGQKKGpvcmRhbi5sZWVAZXhhbXBsZS50ZXN0KSBUagowIC0xNSBUZAooRWR1Y2F0aW9uOiBDb21wdXRlciBTY2llbmNlIHN0dWRlbnQpIFRqCjAgLTE1IFRkCihJbnRlcmVzdDogaW1tZXJzaXZlIHRlY2hub2xvZ3kpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjQgMDAwMDAgbiAKMDAwMDAwMDEyMSAwMDAwMCBuIAowMDAwMDAwMjQ3IDAwMDAwIG4gCjAwMDAwMDAzMTcgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA2IC9Sb290IDEgMCBSIC9JbmZvIDw8IC9UaXRsZSAocmVzdW1lX21pbmltYWwucGRmKSA+PiA+PgpzdGFydHhyZWYKNTY0CiUlRU9GCg==', 'base64')));
    return NextResponse.json({ ok: true, t });
  } catch (e) {
    return NextResponse.json({ ok: false, e: String(e), s: (e as Error).stack?.slice(0, 1200) });
  }
}
