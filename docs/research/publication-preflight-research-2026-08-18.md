# Publication Preflight Research

## Findings

Authoritative PDF guidance identifies structural tags as the foundation of assistive-technology navigation. A PDF should have a `Document` root, hierarchical headings, paragraph and list tags, figure descriptions, and table structures with `Table`, `TR`, `TH`, and `TD` semantics [1]. This is a capability boundary for the current renderer: the app can validate source completeness and provenance, but it should not claim tagged-PDF accessibility without inspecting the generated artifact.

Mobile PDF guidance recommends a single-column layout where possible, readable text, consistent margins, compressed images, and an actual phone review after export [2]. The practical product implication is to keep the web/mobile reading surface strong while preflight checks export settings and warns when the document may require excessive horizontal scrolling or zooming.

Adobe’s accessible-PDF guidance also treats accessibility as something to consider before conversion and provides separate inspection and preflight workflows. The app should therefore expose a clear distinction between automated source checks, rendered-preview review, and external PDF accessibility verification [3].

## References

[1]: https://www.section508.gov/create/pdfs/common-tags-and-usage/ "Section 508 — Common PDF Tags and Their Usage"

[2]: https://www.adobe.com/acrobat/hub/create-a-mobile-friendly-pdf.html "Adobe — How to create a mobile-friendly PDF"

[3]: https://helpx.adobe.com/acrobat/using/creating-accessible-pdfs.html "Adobe Acrobat User Guide — Creating accessible PDFs"
