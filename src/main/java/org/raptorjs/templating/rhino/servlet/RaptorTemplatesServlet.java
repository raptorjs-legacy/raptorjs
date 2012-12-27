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

package org.raptorjs.templating.rhino.servlet;

import java.io.IOException;

import javax.servlet.RequestDispatcher;
import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

public class RaptorTemplatesServlet extends HttpServlet {
    
    private final transient Log log = LogFactory.getLog(RaptorTemplatesServlet.class);
    /**
     * 
     */
    private static final long serialVersionUID = 1L;
    
    private transient ServletContext context;
    private ServletConfig config;
    
    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        this.config = config;
        this.context = config.getServletContext();
        
    }
    
    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        String templateUri = (String) request.getAttribute(
                RequestDispatcher.INCLUDE_SERVLET_PATH);
        if (templateUri != null) {
            /*
             * Requested template has been target of
             * RequestDispatcher.include(). Its path is assembled from the
             * relevant javax.servlet.include.* request attributes
             */
            String pathInfo = (String) request.getAttribute(
                    RequestDispatcher.INCLUDE_PATH_INFO);
            if (pathInfo != null) {
                templateUri += pathInfo;
            }
        } else {
            /*
             * Requested template has not been the target of a 
             * RequestDispatcher.include(). Reconstruct its path from the
             * request's getServletPath() and getPathInfo()
             */
            templateUri = request.getServletPath();
            String pathInfo = request.getPathInfo();
            if (pathInfo != null) {
                templateUri += pathInfo;
            }
        }

        if (log.isDebugEnabled()) {    
            log.debug("Raptor Templating Enging --> " + templateUri);
            log.debug("\t     ServletPath: " + request.getServletPath());
            log.debug("\t        PathInfo: " + request.getPathInfo());
            log.debug("\t        RealPath: " + context.getRealPath(templateUri));
            log.debug("\t      RequestURI: " + request.getRequestURI());
            log.debug("\t     QueryString: " + request.getQueryString());
        }
        
        
        try {
            serviceRhtmlFile(request, response, templateUri);
        } catch (RuntimeException e) {
            throw e;
        } catch (ServletException e) {
            throw e;
        } catch (IOException e) {
            throw e;
        } catch (Throwable e) {
            throw new ServletException(e);
        }
    }
    
    private void serviceRhtmlFile(
            HttpServletRequest request,
            HttpServletResponse response, 
            String templateUri)
        throws ServletException, IOException {

    }

    public ServletContext getContext() {
        return context;
    }

    public ServletConfig getConfig() {
        return config;
    }
    
    

}
