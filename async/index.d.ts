import { DynamicPart } from "../core";

export function delay<T>(ms: number, resolved?: T): Promise<T>;

export function lazy<TProps>(
  importFn: (props?: TProps) => any,
  fallback?: any
): DynamicPart<TProps>;

export interface Loadable<T> extends Promise<T> {
  load(value: T | Promise<T>);
  readonly value: T;
  readonly error: any;
  readonly status: "loaded" | "loading" | "failed";
}

export function loadable<T = any>(initial?: T): Loadable<T>;

export const Suspense: DynamicPart<{ fallback?: any; children?: any }>;
