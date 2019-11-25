// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { expect } from 'chai';

import { KernelSpec } from '@jupyterlab/services';

import { expectFailure } from '@jupyterlab/testutils';

import { makeSettings, PYTHON_SPEC, getRequestHandler } from '../utils';

const PYTHON3_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
PYTHON3_SPEC.name = 'Python3';
PYTHON3_SPEC.display_name = 'python3';

describe('kernel', () => {
  describe('KernelSpec.getSpecs()', () => {
    it('should load the kernelspecs', async () => {
      const specs = await KernelSpec.getSpecs();
      expect(specs.default).to.be.ok;
    });

    it('should accept ajax options', async () => {
      const serverSettings = makeSettings();
      const specs = await KernelSpec.getSpecs(serverSettings);
      expect(specs.default).to.be.ok;
    });

    it('should handle a missing default parameter', async () => {
      const serverSettings = getRequestHandler(200, {
        kernelspecs: { python: PYTHON_SPEC }
      });
      const specs = await KernelSpec.getSpecs(serverSettings);
      expect(specs.default).to.be.ok;
    });

    it('should throw for a missing kernelspecs parameter', async () => {
      const serverSettings = getRequestHandler(200, {
        default: PYTHON_SPEC.name
      });
      const promise = KernelSpec.getSpecs(serverSettings);
      await expectFailure(promise, 'No kernelspecs found');
    });

    it('should omit an invalid kernelspec', async () => {
      const R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      R_SPEC.name = 1;
      const serverSettings = getRequestHandler(200, {
        default: 'python',
        kernelspecs: {
          R: R_SPEC,
          python: PYTHON_SPEC
        }
      });
      const specs = await KernelSpec.getSpecs(serverSettings);
      expect(specs.default).to.equal('python');
      expect(specs.kernelspecs['R']).to.be.undefined;
    });

    it('should handle an improper name', async () => {
      const R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      R_SPEC.name = 1;
      const serverSettings = getRequestHandler(200, {
        default: 'R',
        kernelspecs: { R: R_SPEC }
      });
      const promise = KernelSpec.getSpecs(serverSettings);
      await expectFailure(promise, 'No valid kernelspecs found');
    });

    it('should handle an improper language', async () => {
      const R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      R_SPEC.spec.language = 1;
      const serverSettings = getRequestHandler(200, {
        default: 'R',
        kernelspecs: { R: R_SPEC }
      });
      const promise = KernelSpec.getSpecs(serverSettings);
      await expectFailure(promise, 'No valid kernelspecs found');
    });

    it('should handle an improper argv', async () => {
      const R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      R_SPEC.spec.argv = 'hello';
      const serverSettings = getRequestHandler(200, {
        default: 'R',
        kernelspecs: { R: R_SPEC }
      });
      const promise = KernelSpec.getSpecs(serverSettings);
      await expectFailure(promise, 'No valid kernelspecs found');
    });

    it('should handle an improper display_name', async () => {
      const R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      R_SPEC.spec.display_name = ['hello'];
      const serverSettings = getRequestHandler(200, {
        default: 'R',
        kernelspecs: { R: R_SPEC }
      });
      const promise = KernelSpec.getSpecs(serverSettings);
      await expectFailure(promise, 'No valid kernelspecs found');
    });

    it('should handle missing resources', async () => {
      const R_SPEC = JSON.parse(JSON.stringify(PYTHON_SPEC));
      delete R_SPEC.resources;
      const serverSettings = getRequestHandler(200, {
        default: 'R',
        kernelspecs: { R: R_SPEC }
      });
      const promise = KernelSpec.getSpecs(serverSettings);
      await expectFailure(promise, 'No valid kernelspecs found');
    });

    it('should throw an error for an invalid response', async () => {
      const serverSettings = getRequestHandler(201, {});
      const promise = KernelSpec.getSpecs(serverSettings);
      await expectFailure(promise, 'Invalid response: 201 Created');
    });

    it('should handle metadata', async () => {
      const PYTHON_SPEC_W_MD = JSON.parse(JSON.stringify(PYTHON_SPEC));
      PYTHON_SPEC_W_MD.spec.metadata = { some_application: { key: 'value' } };
      const serverSettings = getRequestHandler(200, {
        default: 'python',
        kernelspecs: { python: PYTHON_SPEC_W_MD }
      });
      const specs = await KernelSpec.getSpecs(serverSettings);

      expect(specs.kernelspecs['python']).to.have.property('metadata');
      const metadata = specs.kernelspecs['python'].metadata;
      expect(metadata).to.have.property('some_application');
      expect((metadata as any).some_application).to.have.property(
        'key',
        'value'
      );
    });

    it('should handle env values', async () => {
      const PYTHON_SPEC_W_ENV = JSON.parse(JSON.stringify(PYTHON_SPEC));
      PYTHON_SPEC_W_ENV.spec.env = {
        SOME_ENV: 'some_value',
        LANG: 'en_US.UTF-8'
      };
      const serverSettings = getRequestHandler(200, {
        default: 'python',
        kernelspecs: { python: PYTHON_SPEC_W_ENV }
      });
      const specs = await KernelSpec.getSpecs(serverSettings);

      expect(specs.kernelspecs['python']).to.have.property('env');
      const env = specs.kernelspecs['python'].env;
      expect(env).to.have.property('SOME_ENV', 'some_value');
      expect(env).to.have.property('LANG', 'en_US.UTF-8');
    });
  });
});
