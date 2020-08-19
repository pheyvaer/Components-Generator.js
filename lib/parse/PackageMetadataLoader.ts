import * as Path from 'path';
import { ResolutionContext } from '../resolution/ResolutionContext';

/**
 * Load metadata from packages.
 */
export class PackageMetadataLoader {
  private readonly resolutionContext: ResolutionContext;

  public constructor(args: PackageMetadataLoaderArgs) {
    this.resolutionContext = args.resolutionContext;
  }

  /**
   * Load the metadata from the given package.
   * @param packageRootDirectory The path to a package that should contain a package.json.
   */
  public async load(packageRootDirectory: string): Promise<PackageMetadata> {
    // Read package.json
    const packageJsonPath = Path.join(packageRootDirectory, 'package.json');
    const packageJsonRaw = await this.resolutionContext.getFileContent(packageJsonPath);
    let packageJson: any;
    try {
      packageJson = JSON.parse(packageJsonRaw);
    } catch (error) {
      throw new Error(`Invalid package: Syntax error in ${packageJsonPath}: ${error.message}`);
    }

    // Extract required fields from package.json
    const name = packageJson.name;
    if (!('lsd:module' in packageJson)) {
      throw new Error(`Invalid package: Missing 'lsd:module' IRI in ${packageJsonPath}`);
    }
    const moduleIri = packageJson['lsd:module'];
    if (!('lsd:components' in packageJson)) {
      throw new Error(`Invalid package: Missing 'lsd:components' in ${packageJsonPath}`);
    }
    const componentsPath = Path.join(packageRootDirectory, packageJson['lsd:components']);
    if (!('lsd:contexts' in packageJson)) {
      throw new Error(`Invalid package: Missing 'lsd:contexts' in ${packageJsonPath}`);
    }
    // Transform relative to absolute paths in lsd:context values
    const contexts = Object.entries(<{[iri: string]: string}> packageJson['lsd:contexts'])
      .reduce((acc, [ key, value ]) => {
        acc[key] = Path.join(packageRootDirectory, value);
        return acc;
      }, <{[iri: string]: string}> {});

    // Construct metadata hash
    return {
      name,
      moduleIri,
      componentsPath,
      contexts,
    };
  }
}

export interface PackageMetadataLoaderArgs {
  resolutionContext: ResolutionContext;
}

export interface PackageMetadata {
  name: string;
  moduleIri: string;
  componentsPath: string;
  contexts: {[iri: string]: string};
}
