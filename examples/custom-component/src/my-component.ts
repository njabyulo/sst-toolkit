import * as Component from "@sst-toolkit/plugin-sdk/component";
import type { ComponentResourceOptions } from "@pulumi/pulumi";

export interface IMyComponentProps {
  message?: string;
}

export class MyComponent extends Component.Component.SSTComponent {
  constructor(
    name: string,
    props: IMyComponentProps = {},
    opts?: ComponentResourceOptions
  ) {
    super("sst:example:MyComponent", name, props, opts);

    this.registerOutputs({
      message: props.message || "Hello from MyComponent!",
    });
  }

  protected getLinkProperties(): Record<string, unknown> {
    return {
      message: "Hello from MyComponent!",
    };
  }
}

