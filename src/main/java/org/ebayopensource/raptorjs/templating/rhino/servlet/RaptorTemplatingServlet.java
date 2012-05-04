package org.ebayopensource.raptorjs.templating.rhino.servlet;

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

public class RaptorTemplatingServlet extends HttpServlet {
    
    private final transient Log log = LogFactory.getLog(RaptorTemplatingServlet.class);
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
