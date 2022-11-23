import init from '../init/init';
import { checkForTestTarget } from './lib/check-for-test-target';
import { createFiles } from './lib/create-files';
import { updateTsConfig } from './lib/update-tsconfig';
import { updateWorkspace } from './lib/update-workspace';
import { updateJestConfig } from './lib/update-jestconfig';
import { JestProjectSchema } from './schema';
import { formatFiles, Tree, convertNxGenerator } from '@nrwl/devkit';

const schemaDefaults = {
  setupFile: 'none',
  babelJest: false,
  supportTsx: false,
  skipSetupFile: false,
  skipSerializers: false,
  rootProject: false,
} as const;

function normalizeOptions(options: JestProjectSchema) {
  if (!options.testEnvironment) {
    options.testEnvironment = 'jsdom';
  }
  if (options.testEnvironment === 'jsdom') {
    options.testEnvironment = '';
  }

  if (!options.hasOwnProperty('supportTsx')) {
    options.supportTsx = false;
  }

  // if we support TSX or compiler is not tsc, then we don't support angular(html templates)
  if (
    options.supportTsx ||
    options.babelJest ||
    ['swc', 'babel'].includes(options.compiler)
  ) {
    options.skipSerializers = true;
  }

  if (!options.skipSetupFile) {
    return options;
  }

  // setupFile is always 'none'
  options.setupFile = schemaDefaults.setupFile;
  options.rootProject = options.rootProject;
  return {
    ...schemaDefaults,
    ...options,
  };
}

export async function jestProjectGenerator(
  tree: Tree,
  schema: JestProjectSchema
) {
  const options = normalizeOptions(schema);
  const installTask = init(tree, options);
  checkForTestTarget(tree, options);
  createFiles(tree, options);
  updateTsConfig(tree, options);
  updateWorkspace(tree, options);
  // TODO(caleb): is this really needed anymore?
  // surely everyone is on the getJestProjects() fn usage already?
  // should remove it and provide a migration (just in case) so we can remove it
  // which makes the root project work simpler
  // updateJestConfig(tree, options);
  if (!schema.skipFormat) {
    await formatFiles(tree);
  }
  return installTask;
}

export const jestProjectSchematic = convertNxGenerator(jestProjectGenerator);
