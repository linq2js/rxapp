export interface ApplicationContext {
  dispatch<TPayload = never, TResult = void>(
    action: (payload?: TPayload) => TResult
  ): TResult;
  update(): void;
}

export interface Application extends ApplicationContext {}

export interface RenderFn<TProps extends {}> extends Function {
  /**
   * @param props   component props
   * @param context application context
   */
  (props?: Readonly<TProps>, context?: ApplicationContext): any;
}
export interface MountOptions {
  container?: string | Node;
  init?: Function;
}

export type TemplateSlot = Function | {} | DynamicPart<any> | any;

export interface DynamicPart<TProps> extends StaticPart, Function {
  (): StaticPart;

  /**
   * create a dynamic part with specified props
   * @param props
   */
  (props?: TProps);

  /**
   * create a new dynamic part with specified children
   * @param strings
   * @param slots
   */
  (strings: TemplateStringsArray, ...slots: TemplateSlot[]): StaticPart;
}

export interface StaticPart {
  /**
   * mount the part to specified container
   * @param container
   */
  mount(container: string | Node): Application;

  /**
   * mount the part with specified options
   * @param options
   */
  mount(options?: MountOptions): Application;
}

/**
 * create a part with specified renderFn
 * @param renderFn
 */
export function part<TProps>(renderFn: RenderFn<TProps>): DynamicPart<TProps>;

/**
 * create a part that is based on tagged string literal
 * @param strings
 * @param slots
 */
export function part(
  strings: TemplateStringsArray,
  ...slots: TemplateSlot[]
): StaticPart;

/**
 * create memoized function
 * @param fn
 */
export function memo<T extends Function>(fn: T): T;

export function effect(func: Function, deps?: () => any[]): void;

export interface Provider<T>
  extends DynamicPart<{ value: T | (() => T); children?: any }> {}

export interface ConsumeFn<T> extends Function {
  (): T;
  current: T;
}

/**
 * create a new context and return a tuple of the new context provider and consumer
 * @param initial
 */
export function context<T>(initial?: T): [Provider<T>, ConsumeFn<T>];