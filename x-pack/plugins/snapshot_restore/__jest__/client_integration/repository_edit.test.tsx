/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { act } from 'react-dom/test-utils';

import { setupEnvironment, pageHelpers, TestBed, getRandomString } from './helpers';
import { RepositoryForm } from '../../public/application/components/repository_form';
import { RepositoryEditTestSubjects } from './helpers/repository_edit.helpers';
import { RepositoryAddTestSubjects } from './helpers/repository_add.helpers';
import { REPOSITORY_EDIT, REPOSITORY_NAME } from './helpers/constant';

const { setup } = pageHelpers.repositoryEdit;
const { setup: setupRepositoryAdd } = pageHelpers.repositoryAdd;

jest.mock('@kbn/kibana-react-plugin/public', () => {
  const original = jest.requireActual('@kbn/kibana-react-plugin/public');
  return {
    ...original,
    // Mocking CodeEditor, which uses React Monaco under the hood
    CodeEditor: (props: any) => (
      <input
        data-test-subj={props['data-test-subj'] || 'mockCodeEditor'}
        data-currentvalue={props.value}
        onChange={(e: any) => {
          props.onChange(e.jsonContent);
        }}
      />
    ),
  };
});

describe('<RepositoryEdit />', () => {
  let testBed: TestBed<RepositoryEditTestSubjects>;
  let testBedRepositoryAdd: TestBed<RepositoryAddTestSubjects>;
  const { httpSetup, httpRequestsMockHelpers } = setupEnvironment();

  describe('on component mount', () => {
    beforeEach(async () => {
      httpRequestsMockHelpers.setGetRepositoryResponse(REPOSITORY_EDIT.name, {
        repository: REPOSITORY_EDIT,
        snapshots: { count: 0 },
      });

      await act(async () => {
        testBed = await setup(httpSetup);
      });
      testBed.component.update();
    });

    test('should set the correct page title', () => {
      const { find } = testBed;
      expect(find('repositoryForm.stepTwo.title').text()).toBe(
        `'${REPOSITORY_EDIT.name}' settings`
      );
    });

    /**
     * As the "edit" repository component uses the same form underneath that
     * the "create" repository, we won't test it again but simply make sure that
     * the same form component is indeed shared between the 2 app sections.
     */
    test('should use the same Form component as the "<RepositoryAdd />" section', async () => {
      httpRequestsMockHelpers.setLoadRepositoryTypesResponse(['fs', 'url']);

      testBedRepositoryAdd = await setupRepositoryAdd(httpSetup);

      const formEdit = testBed.component.find(RepositoryForm);
      const formAdd = testBedRepositoryAdd.component.find(RepositoryForm);

      expect(formEdit.length).toBe(1);
      expect(formAdd.length).toBe(1);
    });
  });

  describe('should disable client, bucket / container and base path fields for managed repositories', () => {
    const mountComponentWithMock = async (repository: any) => {
      httpRequestsMockHelpers.setGetRepositoryResponse(REPOSITORY_NAME, {
        repository: { name: getRandomString(), ...repository },
        snapshots: { count: 0 },
        isManagedRepository: true,
      });

      await act(async () => {
        testBed = await setup(httpSetup);
      });
      testBed.component.update();
    };

    it('azure repository', async () => {
      await mountComponentWithMock({ type: 'azure' });
      const { find } = testBed;
      const clientInput = find('clientInput');
      expect(clientInput.props().disabled).toEqual(true);

      const containerInput = find('containerInput');
      expect(containerInput.props().disabled).toEqual(true);

      const basePathInput = find('basePathInput');
      expect(basePathInput.props().disabled).toEqual(true);
    });

    it('gcs repository', async () => {
      await mountComponentWithMock({ type: 'gcs' });
      const { find } = testBed;
      const clientInput = find('clientInput');
      expect(clientInput.props().disabled).toEqual(true);

      const bucketInput = find('bucketInput');
      expect(bucketInput.props().disabled).toEqual(true);

      const basePathInput = find('basePathInput');
      expect(basePathInput.props().disabled).toEqual(true);
    });

    it('s3 repository', async () => {
      await mountComponentWithMock({ type: 's3' });
      const { find } = testBed;
      const clientInput = find('clientInput');
      expect(clientInput.props().disabled).toEqual(true);

      const bucketInput = find('bucketInput');
      expect(bucketInput.props().disabled).toEqual(true);

      const basePathInput = find('basePathInput');
      expect(basePathInput.props().disabled).toEqual(true);
    });
  });

  describe('should populate the correct values', () => {
    const mountComponentWithMock = async (repository: any) => {
      httpRequestsMockHelpers.setGetRepositoryResponse(REPOSITORY_NAME, {
        repository: { name: getRandomString(), ...repository },
        snapshots: { count: 0 },
      });
      await act(async () => {
        testBed = await setup(httpSetup);
      });
      testBed.component.update();
    };

    it('fs repository', async () => {
      const settings = {
        location: getRandomString(),
        compress: true,
        chunkSize: getRandomString(),
        maxSnapshotBytesPerSec: getRandomString(),
        maxRestoreBytesPerSec: getRandomString(),
        readonly: true,
      };

      await mountComponentWithMock({ type: 'fs', settings });

      const { find } = testBed;

      expect(find('locationInput').props().defaultValue).toBe(settings.location);
      expect(find('compressToggle').props()['aria-checked']).toBe(settings.compress);
      expect(find('chunkSizeInput').props().defaultValue).toBe(settings.chunkSize);
      expect(find('maxSnapshotBytesInput').props().defaultValue).toBe(
        settings.maxSnapshotBytesPerSec
      );
      expect(find('maxRestoreBytesInput').props().defaultValue).toBe(
        settings.maxRestoreBytesPerSec
      );
      expect(find('readOnlyToggle').props()['aria-checked']).toBe(settings.readonly);
    });

    it('readonly repository', async () => {
      const settings = {
        url: 'https://elastic.co',
      };

      await mountComponentWithMock({ type: 'url', settings });

      const { find } = testBed;

      expect(find('schemeSelect').props().value).toBe('https');
      expect(find('urlInput').props().defaultValue).toBe('elastic.co');
    });

    it('azure repository', async () => {
      const settings = {
        client: getRandomString(),
        container: getRandomString(),
        basePath: getRandomString(),
        compress: true,
        chunkSize: getRandomString(),
        readonly: true,
        locationMode: getRandomString(),
        maxRestoreBytesPerSec: getRandomString(),
        maxSnapshotBytesPerSec: getRandomString(),
      };

      await mountComponentWithMock({ type: 'azure', settings });

      const { find } = testBed;

      expect(find('clientInput').props().defaultValue).toBe(settings.client);
      expect(find('containerInput').props().defaultValue).toBe(settings.container);
      expect(find('basePathInput').props().defaultValue).toBe(settings.basePath);
      expect(find('compressToggle').props()['aria-checked']).toBe(settings.compress);
      expect(find('chunkSizeInput').props().defaultValue).toBe(settings.chunkSize);
      expect(find('maxSnapshotBytesInput').props().defaultValue).toBe(
        settings.maxSnapshotBytesPerSec
      );
      expect(find('maxRestoreBytesInput').props().defaultValue).toBe(
        settings.maxRestoreBytesPerSec
      );
      expect(find('locationModeSelect').props().value).toBe(settings.locationMode);
      expect(find('readOnlyToggle').props()['aria-checked']).toBe(settings.readonly);
    });

    it('gcs repository', async () => {
      const settings = {
        bucket: getRandomString(),
        client: getRandomString(),
        basePath: getRandomString(),
        compress: true,
        chunkSize: getRandomString(),
        readonly: true,
        maxRestoreBytesPerSec: getRandomString(),
        maxSnapshotBytesPerSec: getRandomString(),
      };

      await mountComponentWithMock({ type: 'gcs', settings });

      const { find } = testBed;

      expect(find('clientInput').props().defaultValue).toBe(settings.client);
      expect(find('bucketInput').props().defaultValue).toBe(settings.bucket);
      expect(find('basePathInput').props().defaultValue).toBe(settings.basePath);
      expect(find('compressToggle').props()['aria-checked']).toBe(settings.compress);
      expect(find('chunkSizeInput').props().defaultValue).toBe(settings.chunkSize);
      expect(find('maxSnapshotBytesInput').props().defaultValue).toBe(
        settings.maxSnapshotBytesPerSec
      );
      expect(find('maxRestoreBytesInput').props().defaultValue).toBe(
        settings.maxRestoreBytesPerSec
      );
      expect(find('readOnlyToggle').props()['aria-checked']).toBe(settings.readonly);
    });

    it('hdfs repository', async () => {
      const settings = {
        delegateType: 'gcs',
        uri: 'hdfs://elastic.co',
        path: getRandomString(),
        loadDefault: true,
        compress: true,
        chunkSize: getRandomString(),
        readonly: true,
        'security.principal': getRandomString(),
        maxRestoreBytesPerSec: getRandomString(),
        maxSnapshotBytesPerSec: getRandomString(),
        conf1: 'foo',
        conf2: 'bar',
      };

      await mountComponentWithMock({ type: 'hdfs', settings });

      const { find } = testBed;

      expect(find('uriInput').props().defaultValue).toBe('elastic.co');
      expect(find('pathInput').props().defaultValue).toBe(settings.path);
      expect(find('loadDefaultsToggle').props()['aria-checked']).toBe(settings.loadDefault);
      expect(find('compressToggle').props()['aria-checked']).toBe(settings.compress);
      expect(find('chunkSizeInput').props().defaultValue).toBe(settings.chunkSize);
      expect(find('securityPrincipalInput').props().defaultValue).toBe(
        settings['security.principal']
      );
      expect(find('maxSnapshotBytesInput').props().defaultValue).toBe(
        settings.maxSnapshotBytesPerSec
      );
      expect(find('maxRestoreBytesInput').props().defaultValue).toBe(
        settings.maxRestoreBytesPerSec
      );
      expect(find('readOnlyToggle').props()['aria-checked']).toBe(settings.readonly);

      const codeEditorValue = testBed.find('codeEditor').props()['data-currentvalue'];
      expect(JSON.parse(codeEditorValue)).toEqual({
        loadDefault: true,
        conf1: 'foo',
        conf2: 'bar',
      });
    });

    it('s3 repository', async () => {
      const settings = {
        bucket: getRandomString(),
        client: getRandomString(),
        basePath: getRandomString(),
        compress: true,
        chunkSize: getRandomString(),
        serverSideEncryption: true,
        bufferSize: getRandomString(),
        cannedAcl: getRandomString(),
        storageClass: getRandomString(),
        readonly: true,
        maxRestoreBytesPerSec: getRandomString(),
        maxSnapshotBytesPerSec: getRandomString(),
      };

      await mountComponentWithMock({ type: 's3', settings });

      const { find } = testBed;

      expect(find('clientInput').props().defaultValue).toBe(settings.client);
      expect(find('bucketInput').props().defaultValue).toBe(settings.bucket);
      expect(find('basePathInput').props().defaultValue).toBe(settings.basePath);
      expect(find('compressToggle').props()['aria-checked']).toBe(settings.compress);
      expect(find('chunkSizeInput').props().defaultValue).toBe(settings.chunkSize);
      expect(find('serverSideEncryptionToggle').props()['aria-checked']).toBe(
        settings.serverSideEncryption
      );
      expect(find('bufferSizeInput').props().defaultValue).toBe(settings.bufferSize);
      expect(find('cannedAclSelect').props().value).toBe(settings.cannedAcl);
      expect(find('storageClassSelect').props().value).toBe(settings.storageClass);
      expect(find('maxSnapshotBytesInput').props().defaultValue).toBe(
        settings.maxSnapshotBytesPerSec
      );
      expect(find('maxRestoreBytesInput').props().defaultValue).toBe(
        settings.maxRestoreBytesPerSec
      );
      expect(find('readOnlyToggle').props()['aria-checked']).toBe(settings.readonly);
    });
  });
});
