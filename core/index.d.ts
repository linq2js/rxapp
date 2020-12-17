export interface ApplicationContext {
  dispatch<TPayload = never, TResult = void>(
    action: (payload?: TPayload) => TResult
  ): TResult;
  action<T>(action: T): T;
  update(): void;
  actions: { [key: string]: (payload?: any) => any };
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
  effects?: (Effect | [Effect, any])[];
  actions?: { [key: string]: (payload?: any) => any };
}

export type Effect = (context?: ApplicationContext) => any;

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

export interface PartOptions {
  lazy?: boolean;
}

/**
 * create a part with specified renderFn
 * @param renderFn
 * @param options
 */
export function part<TProps>(
  renderFn: RenderFn<TProps>,
  options?: PartOptions
): DynamicPart<TProps>;

/**
 * create a part that is based on tagged string literal
 * @param strings
 * @param slots
 */
export function part(
  strings: TemplateStringsArray,
  ...slots: TemplateSlot[]
): StaticPart;

export interface Memo {
  /**
   * create memoized function
   * @param fn
   */
  <T extends Function>(fn: T): T;

  <T, TResult>(
    selector: (...args: any[]) => T,
    fn: (result?: T, ...args: any[]) => TResult
  ): (...args: any[]) => TResult;

  list<TItem, TMapResult>(
    map: (item: TItem, index?: number) => TMapResult
  ): (list: TItem[]) => TMapResult[];

  list<TItem, TSelectResult, TMapResult>(
    select: (item: TItem, index?: number) => TSelectResult,
    map: (item: TSelectResult, index?: number) => TMapResult
  ): (list: TItem[]) => TMapResult[];
}

export const memo: Memo;

export function effect(func: Function, deps?: () => any[]): void;

export interface Provider<T>
  extends DynamicPart<{ value: T | (() => T); children?: any }> {}

export interface ConsumeFn<T> extends Function {
  (): { current: T };
}

/**
 * create a new context and return a tuple of the new context provider and consumer
 * @param initial
 */
export function context<T>(initial?: T): [Provider<T>, ConsumeFn<T>];

export function handle(imperativeHandle: any): void;

export const Chunk: DynamicPart<{
  size?: number;
  debounce?: number;
  data: any[];
  render: (items: any[], index?: number) => any;
}>;
export function keyed<TKey, TContent>(
  key: TKey,
  content: TContent
): { key: TKey; content: TContent };
