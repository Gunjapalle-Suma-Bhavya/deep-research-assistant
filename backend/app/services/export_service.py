"""Export service for generating Markdown, HTML, and PDF documents."""

import re
from typing import Dict, Any, Optional
from datetime import datetime


def generate_html_document(title: str, markdown_content: str, metadata: Optional[Dict[str, Any]] = None) -> str:
    """Generate standalone styled HTML document from markdown research report."""
    # Convert markdown headers and lists to basic HTML
    html_body = markdown_content
    
    # Simple markdown to HTML converter for self-contained output
    lines = html_body.split("\n")
    formatted_lines = []
    in_code_block = False
    in_ul = False
    
    for line in lines:
        if line.startswith("```"):
            in_code_block = not in_code_block
            formatted_lines.append("<pre><code>" if in_code_block else "</code></pre>")
            continue
        
        if in_code_block:
            formatted_lines.append(line.replace("<", "&lt;").replace(">", "&gt;"))
            continue
        
        if line.startswith("# "):
            formatted_lines.append(f"<h1 class='text-3xl font-bold mt-8 mb-4 text-blue-900'>{line[2:]}</h1>")
        elif line.startswith("## "):
            formatted_lines.append(f"<h2 class='text-2xl font-semibold mt-6 mb-3 text-gray-800 border-b pb-2'>{line[3:]}</h2>")
        elif line.startswith("### "):
            formatted_lines.append(f"<h3 class='text-xl font-medium mt-4 mb-2 text-gray-700'>{line[4:]}</h3>")
        elif line.startswith("- "):
            if not in_ul:
                formatted_lines.append("<ul class='list-disc pl-6 space-y-1 mb-4 text-gray-700'>")
                in_ul = True
            item_text = line[2:]
            # Replace markdown links
            item_text = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2" target="_blank" class="text-blue-600 underline">\1</a>', item_text)
            formatted_lines.append(f"<li>{item_text}</li>")
        elif line.strip() == "":
            if in_ul:
                formatted_lines.append("</ul>")
                in_ul = False
            formatted_lines.append("<p class='mb-3'></p>")
        else:
            if in_ul:
                formatted_lines.append("</ul>")
                in_ul = False
            p_text = line
            # Convert bold and links
            p_text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', p_text)
            p_text = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2" target="_blank" class="text-blue-600 underline">\1</a>', p_text)
            formatted_lines.append(f"<p class='leading-relaxed text-gray-800 mb-3'>{p_text}</p>")
            
    if in_ul:
        formatted_lines.append("</ul>")
        
    content_html = "\n".join(formatted_lines)
    
    date_str = datetime.now().strftime("%B %d, %Y")
    
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - Deep Research Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }}
        @media print {{
            body {{ background: white; color: black; }}
            .no-print {{ display: none; }}
        }}
    </style>
</head>
<body class="bg-gray-50 text-gray-900 py-10 px-4 sm:px-8">
    <div class="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-sm rounded-xl border border-gray-200">
        <div class="border-b pb-6 mb-8 flex justify-between items-center">
            <div>
                <span class="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Deep Research Synthesis</span>
                <p class="text-sm text-gray-500 mt-2">Generated on {date_str} by Multi-Agent Research Assistant</p>
            </div>
            <button onclick="window.print()" class="no-print bg-gray-900 hover:bg-black text-white text-sm font-medium px-4 py-2 rounded-lg transition">Print / Save PDF</button>
        </div>
        <div class="prose max-w-none">
            {content_html}
        </div>
    </div>
</body>
</html>
"""
