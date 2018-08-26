/**
 * DO NOT EDIT
 *
 * This file was automatically generated by
 *   https://github.com/Polymer/tools/tree/master/packages/gen-typescript-declarations
 *
 * To modify these typings, edit the source file(s):
 *   lib/utils/case-map.html
 */


// tslint:disable:variable-name API description

/// <reference path="boot.d.ts" />

declare namespace Polymer {

  /**
   * Module with utilities for converting between "dash-case" and "camelCase"
   * identifiers.
   */
  namespace CaseMap {


    /**
     * Converts "dash-case" identifier (e.g. `foo-bar-baz`) to "camelCase"
     * (e.g. `fooBarBaz`).
     *
     * @returns Camel-case representation of the identifier
     */
    function dashToCamelCase(dash: string): string;


    /**
     * Converts "camelCase" identifier (e.g. `fooBarBaz`) to "dash-case"
     * (e.g. `foo-bar-baz`).
     *
     * @returns Dash-case representation of the identifier
     */
    function camelToDashCase(camel: string): string;
  }
}