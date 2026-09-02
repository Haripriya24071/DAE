from fpdf import FPDF

doc1_text = """Remote Work Policy v1.0
Employees are allowed to work remotely up to three days per week. Approval must be granted by the direct manager at least 24 hours in advance. All remote work must be conducted within the home country for tax compliance reasons. Core hours are 10:00 AM to 2:00 PM, during which all employees must be active on Slack."""

doc2_text = """Remote Work Policy v1.1
Effective immediately, the remote work allowance has been increased to four days per week. Managers must approve remote requests at least 48 hours in advance. Employees are permitted to work from any international location, provided they maintain a stable internet connection. Core hours remain 10:00 AM to 2:00 PM."""

for filename, text in [("doc1.pdf", doc1_text), ("doc2.pdf", doc2_text)]:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 10, text)
    pdf.output(filename)

print("doc1.pdf and doc2.pdf created.")