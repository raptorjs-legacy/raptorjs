package org.raptorjs.resources.packaging.test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;

import org.codehaus.jackson.JsonProcessingException;
import org.junit.Test;
import org.raptorjs.resources.FileResource;
import org.raptorjs.resources.Resource;
import org.raptorjs.resources.packaging.ContentType;
import org.raptorjs.resources.packaging.Extension;
import org.raptorjs.resources.packaging.Dependency;
import org.raptorjs.resources.packaging.DependencyCSS;
import org.raptorjs.resources.packaging.DependencyFactory;
import org.raptorjs.resources.packaging.DependencyJS;
import org.raptorjs.resources.packaging.IncludeOptions;
import org.raptorjs.resources.packaging.PackageManifest;
import org.raptorjs.resources.packaging.PackageManifestJSONLoader;
import org.raptorjs.resources.packaging.ResourceIncluderContext;

public class PackageManifestJSONLoaderTest {
	private void _testOldNew(PackageManifest manifest) {
		List<Dependency> includes = manifest.getDependencies();
		assertNotNull(includes);
		assertEquals(includes.size(), 2);
		IncludeJSTest js0 = (IncludeJSTest) includes.get(0);
		assertEquals(js0.getType(), "js");
		assertEquals(js0.getProperty("path"), "Test.js");
		assertEquals(js0.getContentType(), ContentType.JS);
		
		IncludeJSTest js1 = (IncludeJSTest) includes.get(1);
		assertEquals(js1.getType(), "js");
		assertEquals(js1.getProperty("path"), "extensions.js");
		assertEquals(js1.getContentType(), ContentType.JS);
	}
	
	@Test
	public void testManifestLoaderOld() throws JsonProcessingException, IOException {
		DependencyFactory includeFactory = new DependencyFactory();
		includeFactory.registerIncludeType("js", IncludeJSTest.class);
		PackageManifestJSONLoader loader = new PackageManifestJSONLoader(includeFactory);
		InputStream in = PackageManifestJSONLoaderTest.class.getResourceAsStream("/packaging/test/old-package.json");
		PackageManifest manifest = new PackageManifest();
		loader.load(manifest, in);
		this._testOldNew(manifest);
	}
	
	@Test
	public void testManifestLoaderNew1() throws JsonProcessingException, IOException {
		DependencyFactory includeFactory = new DependencyFactory();
		includeFactory.registerIncludeType("js", IncludeJSTest.class);
		PackageManifestJSONLoader loader = new PackageManifestJSONLoader(includeFactory);
		InputStream in = PackageManifestJSONLoaderTest.class.getResourceAsStream("/packaging/test/new1-package.json");
		PackageManifest manifest = new PackageManifest();
		loader.load(manifest, in);
		this._testOldNew(manifest);
	}
	
	@Test
	public void testTableWebPackage() throws JsonProcessingException, IOException {
		DependencyFactory includeFactory = new DependencyFactory();
		includeFactory.registerIncludeType("js", IncludeJSTest.class);
		includeFactory.registerIncludeType("4cc", Include4ccTest.class);
		includeFactory.registerIncludeType("less", IncludeLessTest.class);
		PackageManifestJSONLoader loader = new PackageManifestJSONLoader(includeFactory);
		InputStream in = PackageManifestJSONLoaderTest.class.getResourceAsStream("/packaging/test/tablet-web-package.json");
		Resource resource = new FileResource(".", null, new File("."));
		PackageManifest manifest = new PackageManifest();
		manifest.setResource(resource);
		loader.load(manifest, in);
		List<Extension> extensions = manifest.getExtensions();
		assertEquals(extensions.size(), 1);
	}
	
	
	
	public static class IncludeJSTest extends DependencyJS {

		@Override
		public String toString() {
			// TODO Auto-generated method stub
			return null;
		}

		@Override
		protected void doInclude(IncludeOptions includeOptions,
				ResourceIncluderContext context) {
			// TODO Auto-generated method stub
			
		}

		@Override
		protected void doIncludeAsync(IncludeOptions includeOptions,
				ResourceIncluderContext context) {
			// TODO Auto-generated method stub
			
		}
		
	}
	
	public static class IncludeLessTest extends DependencyCSS {

		@Override
		public String toString() {
			// TODO Auto-generated method stub
			return null;
		}

		@Override
		protected void doInclude(IncludeOptions includeOptions,
				ResourceIncluderContext context) {
			// TODO Auto-generated method stub
			
		}

		@Override
		protected void doIncludeAsync(IncludeOptions includeOptions,
				ResourceIncluderContext context) {
			// TODO Auto-generated method stub
			
		}
		
	}
	
	public static class Include4ccTest extends DependencyJS {

		@Override
		public String toString() {
			// TODO Auto-generated method stub
			return null;
		}

		@Override
		protected void doInclude(IncludeOptions includeOptions,
				ResourceIncluderContext context) {
			// TODO Auto-generated method stub
			
		}

		@Override
		protected void doIncludeAsync(IncludeOptions includeOptions,
				ResourceIncluderContext context) {
			// TODO Auto-generated method stub
			
		}
		
	}
}
