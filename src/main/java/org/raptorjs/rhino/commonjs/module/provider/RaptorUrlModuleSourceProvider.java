package org.raptorjs.rhino.commonjs.module.provider;

import java.io.IOException;
import java.net.URI;

import org.mozilla.javascript.commonjs.module.provider.ModuleSource;
import org.mozilla.javascript.commonjs.module.provider.UrlModuleSourceProvider;

public class RaptorUrlModuleSourceProvider extends UrlModuleSourceProvider {

	private static final long serialVersionUID = 1L;

	public RaptorUrlModuleSourceProvider(Iterable<URI> privilegedUris,
			Iterable<URI> fallbackUris) {
		super(privilegedUris, fallbackUris);
		// TODO Auto-generated constructor stub
	}
	
	@Override
	protected ModuleSource loadFromActualUri(URI uri, URI base, Object validator)
			throws IOException {
		try
		{
			return super.loadFromActualUri(uri, base, validator);
		}
		catch(IOException e) {
			return null;
		}
	}
}
