package org.raptorjs.rhino;

import java.io.StringWriter;

public class XmlHelper {
	
	
	
	private StringWriter createStringWriter(String str) {
		return new StringWriter((int)((float)str.length() * 1.1f));
	}
	
	public String escapeXml(String str) {
		StringWriter writer = this.createStringWriter(str);
		int len = str.length();
		for (int i=0; i<len; i++) {
			char c = str.charAt(i);
			if (c == '&') {
				writer.append("&amp;");
			}
			else if (c == '<') {
				writer.append("&lt;");
			}
			else {
				writer.append(c);
			}
		}
		return writer.toString();
		
	}

	public String escapeXmlAttr(String str) {
		StringWriter writer = this.createStringWriter(str);
		int len = str.length();
		for (int i=0; i<len; i++) {
			char c = str.charAt(i);
			if (c == '&') {
				writer.append("&amp;");
			}
			else if (c == '<') {
				writer.append("&lt;");
			}
			else if (c == '>') {
				writer.append("&gt;");
			}
			else if (c == '\'') {
				writer.append("&apos;");
			}
			else if (c == '"') {
				writer.append("&quot;");
			}
			else if (c == '\n') {
				writer.append("&#10;");
			}
			else {
				writer.append(c);
			}
		}
		return writer.toString();
	}
	
	
}
