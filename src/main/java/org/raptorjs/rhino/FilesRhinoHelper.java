/*
 * Copyright 2011 eBay Software Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.raptorjs.rhino;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Reader;
import java.io.StringWriter;
import java.io.Writer;

public class FilesRhinoHelper {
    public FilesRhinoHelper(RaptorJSEnv raptorJS) {
        
    }
    
    public Object readFully(File file, String encoding)
    {   
    	try
    	{
	    	if (encoding == null) {
	    		return this.readAsBinary(file);
	    	}
	    	else {
	    		return this.readAsString(file, encoding);
	    	}
	    }
	    catch (Exception e)
	    {
	        throw new RuntimeException("Unable to read file \"" + file + "\". Exception: " + e, e);
	    } 
    }
    
    public void writeFully(File file, Object data, String encoding)
    {   
    	if (encoding == null) {
    		if (data instanceof byte[]) {
    			this.writeAsBinary(file, (byte[])data);
    		}
    		else {
    			throw new RuntimeException("Illegal data argument: " + (data != null ? data.getClass().getName() : "null"));
    		}
    	}
    	else {
    		if (data instanceof String) {
    			this.writeAsString(file, (String)data, encoding);
    		}
    		else {
    			throw new RuntimeException("Illegal data argument: " + (data != null ? data.getClass().getName() : "null"));
    		}
    	}
    	
    	 
    }
    
    public String readAsString(File file, String encoding) {
    	
    	
    	Reader in = null;
            
        StringWriter out = new StringWriter();
        char[] buffer = new char[4096];
        try
        {
        	in = new InputStreamReader(new BufferedInputStream(new FileInputStream(file)), encoding);
            int len;
            while ((len = in.read(buffer)) != -1)
            {
                out.write(buffer, 0, len);
            }
        }
        catch(Exception e) {
        	throw new RuntimeException("Unable to read " + encoding + " text file \"" + file + "\". Exception: " + e, e);
        }
        finally
        {
            if (in != null) {
            	try {
					in.close();
				} 
            	catch (IOException e) {
					throw new RuntimeException("Unable to close text file \"" + file + "\". Exception: " + e, e);
				}
            }
        }
        return out.toString();

    }
    
    public void writeAsString(File file, String data, String encoding) {

		Writer out = null;
        try
        {
        	out = new OutputStreamWriter(new BufferedOutputStream(new FileOutputStream(file)), encoding);
        	out.write(data);
        }
        catch (Exception e)
	    {
	        throw new RuntimeException("Unable to write " + encoding + " text file \"" + file + "\". Exception: " + e, e);
	    }
        finally
        {
            if (out != null) {
            	try {
					out.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					throw new RuntimeException("Unable to close binary file \"" + file + "\". Exception: " + e, e);
				}
            }
        }
   
    }
    
    public byte[] readAsBinary(File file) {
		byte[] result = new byte[(int) file.length()];
		int totalBytesRead = 0;
		InputStream input = null;
		try {
			
			input = new BufferedInputStream(new FileInputStream(file));
			while (totalBytesRead < result.length) {
				int bytesRemaining = result.length - totalBytesRead;
				int bytesRead = input.read(result, totalBytesRead, bytesRemaining);
				
				if (bytesRead > 0) {
					totalBytesRead = totalBytesRead + bytesRead;
				}
			}
			return result;
		} 
		catch(Exception e) {
	    	throw new RuntimeException("Unable to read binary file \"" + file + "\". Exception: " + e, e);
	    }
		finally {
			try {
				if (input != null) {
					input.close();
				}
			} catch (IOException e) {
				throw new RuntimeException("Unable to close binary file \"" + file + "\". Exception: " + e, e);
			}
		}
    }
    
    public void writeAsBinary(File file, byte[] data) {
    	
    	OutputStream output = null;
        try {
          output = new BufferedOutputStream(new FileOutputStream(file));
          output.write(data);
        }
        catch (Exception e) {
        	throw new RuntimeException("Unable to write binary file \"" + file + "\". Exception: " + e, e);
        }
        finally {
        	try {
				if (output != null) {
					output.close();
				}
			} catch (IOException e) {
				throw new RuntimeException("Unable to close binary file \"" + file + "\". Exception: " + e, e);
			}
        }
    }
}
