/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiFlexGroup, EuiFlexItem, EuiSpacer } from '@elastic/eui';
import React, { useCallback, useState, useMemo } from 'react';
import { Query, Filter } from 'src/plugins/data/public';
import styled from 'styled-components';

import { AlertsByCategory } from '../components/alerts_by_category';
import { FiltersGlobal } from '../../common/components/filters_global';
import { SiemSearchBar } from '../../common/components/search_bar';
import { WrapperPage } from '../../common/components/wrapper_page';
import { useGlobalTime } from '../../common/containers/use_global_time';
import { useFetchIndex } from '../../common/containers/source';

import { EventsByDataset } from '../components/events_by_dataset';
import { EventCounts } from '../components/event_counts';
import { OverviewEmpty } from '../components/overview_empty';
import { StatefulSidebar } from '../components/sidebar';
import { SignalsByCategory } from '../components/signals_by_category';
import { inputsSelectors } from '../../common/store';
import { SpyRoute } from '../../common/utils/route/spy_routes';
import { SecurityPageName } from '../../app/types';
import { EndpointNotice } from '../components/endpoint_notice';
import { useMessagesStorage } from '../../common/containers/local_storage/use_messages_storage';
import { ENDPOINT_METADATA_INDEX } from '../../../common/constants';
import { useIngestEnabledCheck } from '../../common/hooks/endpoint/ingest_enabled';
import { useSourcererScope } from '../../common/containers/sourcerer';
import { Sourcerer } from '../../common/components/sourcerer';
import { SourcererScopeName } from '../../common/store/sourcerer/model';
import { useDeepEqualSelector } from '../../common/hooks/use_selector';

const DEFAULT_QUERY: Query = { query: '', language: 'kuery' };
const NO_FILTERS: Filter[] = [];

const SidebarFlexItem = styled(EuiFlexItem)`
  margin-right: 24px;
`;

const OverviewComponent = () => {
  const getGlobalFiltersQuerySelector = useMemo(
    () => inputsSelectors.globalFiltersQuerySelector(),
    []
  );
  const getGlobalQuerySelector = useMemo(() => inputsSelectors.globalQuerySelector(), []);
  const query = useDeepEqualSelector((state) => getGlobalQuerySelector(state) ?? DEFAULT_QUERY);
  const filters = useDeepEqualSelector(
    (state) => getGlobalFiltersQuerySelector(state) ?? NO_FILTERS
  );

  const { from, deleteQuery, setQuery, to } = useGlobalTime();
  const { indicesExist, indexPattern, selectedPatterns } = useSourcererScope();

  const endpointMetadataIndex = useMemo<string[]>(() => {
    return [ENDPOINT_METADATA_INDEX];
  }, []);
  const [, { indexExists: metadataIndexExists }] = useFetchIndex(endpointMetadataIndex, true);
  const { addMessage, hasMessage } = useMessagesStorage();
  const hasDismissEndpointNoticeMessage: boolean = useMemo(
    () => hasMessage('management', 'dismissEndpointNotice'),
    [hasMessage]
  );

  const [dismissMessage, setDismissMessage] = useState<boolean>(hasDismissEndpointNoticeMessage);
  const dismissEndpointNotice = useCallback(() => {
    setDismissMessage(true);
    addMessage('management', 'dismissEndpointNotice');
  }, [addMessage]);
  const { allEnabled: isIngestEnabled } = useIngestEnabledCheck();
  return (
    <>
      {indicesExist ? (
        <>
          <FiltersGlobal>
            <SiemSearchBar id="global" indexPattern={indexPattern} />
          </FiltersGlobal>

          <WrapperPage>
            {!dismissMessage && !metadataIndexExists && isIngestEnabled && (
              <>
                <EndpointNotice onDismiss={dismissEndpointNotice} />
                <EuiSpacer size="l" />
              </>
            )}
            <Sourcerer scope={SourcererScopeName.default} />
            <EuiFlexGroup gutterSize="none" justifyContent="spaceBetween">
              <SidebarFlexItem grow={false}>
                <StatefulSidebar />
              </SidebarFlexItem>

              <EuiFlexItem grow={true}>
                <EuiFlexGroup direction="column" gutterSize="none">
                  <EuiFlexItem grow={false}>
                    <SignalsByCategory
                      filters={filters}
                      from={from}
                      indexPattern={indexPattern}
                      query={query}
                      setQuery={setQuery}
                      to={to}
                    />
                    <EuiSpacer size="l" />
                  </EuiFlexItem>

                  <EuiFlexItem grow={false}>
                    <AlertsByCategory
                      deleteQuery={deleteQuery}
                      filters={filters}
                      from={from}
                      indexPattern={indexPattern}
                      indexNames={selectedPatterns}
                      query={query}
                      setQuery={setQuery}
                      to={to}
                    />
                  </EuiFlexItem>

                  <EuiFlexItem grow={false}>
                    <EventsByDataset
                      deleteQuery={deleteQuery}
                      filters={filters}
                      from={from}
                      indexPattern={indexPattern}
                      indexNames={selectedPatterns}
                      query={query}
                      setQuery={setQuery}
                      to={to}
                    />
                  </EuiFlexItem>

                  <EuiFlexItem grow={false}>
                    <EventCounts
                      filters={filters}
                      from={from}
                      indexNames={selectedPatterns}
                      indexPattern={indexPattern}
                      query={query}
                      setQuery={setQuery}
                      to={to}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          </WrapperPage>
        </>
      ) : (
        <OverviewEmpty />
      )}

      <SpyRoute pageName={SecurityPageName.overview} />
    </>
  );
};

export const StatefulOverview = React.memo(OverviewComponent);
