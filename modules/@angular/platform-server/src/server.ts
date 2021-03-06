/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {PlatformLocation} from '@angular/common';
import {platformCoreDynamic} from '@angular/compiler';
import {Injectable, InjectionToken, Injector, NgModule, PLATFORM_INITIALIZER, PlatformRef, Provider, RootRenderer, createPlatformFactory, isDevMode, platformCore} from '@angular/core';
import {BrowserModule, DOCUMENT} from '@angular/platform-browser';

import {ServerPlatformLocation} from './location';
import {Parse5DomAdapter, parseDocument} from './parse5_adapter';
import {PlatformState} from './platform_state';
import {DebugDomRootRenderer} from './private_import_core';
import {SharedStylesHost, getDOM} from './private_import_platform-browser';
import {ServerRootRenderer} from './server_renderer';


function notSupported(feature: string): Error {
  throw new Error(`platform-server does not support '${feature}'.`);
}

export const INTERNAL_SERVER_PLATFORM_PROVIDERS: Array<any /*Type | Provider | any[]*/> = [
  {provide: DOCUMENT, useFactory: _document, deps: [Injector]},
  {provide: PLATFORM_INITIALIZER, useFactory: initParse5Adapter, multi: true, deps: [Injector]},
  {provide: PlatformLocation, useClass: ServerPlatformLocation},
  PlatformState,
];

function initParse5Adapter(injector: Injector) {
  return () => { Parse5DomAdapter.makeCurrent(); };
}

export function _createConditionalRootRenderer(rootRenderer: any) {
  if (isDevMode()) {
    return new DebugDomRootRenderer(rootRenderer);
  }
  return rootRenderer;
}

export const SERVER_RENDER_PROVIDERS: Provider[] = [
  ServerRootRenderer,
  {provide: RootRenderer, useFactory: _createConditionalRootRenderer, deps: [ServerRootRenderer]},
  // use plain SharedStylesHost, not the DomSharedStylesHost
  SharedStylesHost
];

/**
 * Config object passed to initialize the platform.
 *
 * @experimental
 */
export interface PlatformConfig {
  document?: string;
  url?: string;
}

/**
 * The DI token for setting the initial config for the platform.
 *
 * @experimental
 */
export const INITIAL_CONFIG = new InjectionToken<PlatformConfig>('Server.INITIAL_CONFIG');

/**
 * The ng module for the server.
 *
 * @experimental
 */
@NgModule({
  exports: [BrowserModule],
  providers: [
    SERVER_RENDER_PROVIDERS,
  ]
})
export class ServerModule {
}

function _document(injector: Injector) {
  let config: PlatformConfig|null = injector.get(INITIAL_CONFIG, null);
  if (config && config.document) {
    return parseDocument(config.document);
  } else {
    return getDOM().createHtmlDocument();
  }
}

/**
 * @experimental
 */
export const platformServer =
    createPlatformFactory(platformCore, 'server', INTERNAL_SERVER_PLATFORM_PROVIDERS);

/**
 * The server platform that supports the runtime compiler.
 *
 * @experimental
 */
export const platformDynamicServer =
    createPlatformFactory(platformCoreDynamic, 'serverDynamic', INTERNAL_SERVER_PLATFORM_PROVIDERS);
