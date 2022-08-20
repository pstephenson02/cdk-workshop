import { Stack, StackProps } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import { HitCounter } from './hitcounter';
import { TableViewer } from 'cdk-dynamo-table-viewer';
import { Datadog } from 'datadog-cdk-constructs-v2';
import { Construct } from 'constructs';

interface CdkWorkshopStackProps extends StackProps {
  readonly datadogApiKey: string;
}

export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props: CdkWorkshopStackProps) {
    super(scope, id, props);

    const hello = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'hello.handler',
      tracing: lambda.Tracing.ACTIVE
    });

    const helloWithCounter = new HitCounter(this, 'HelloHitCounter', {
      downstream: hello
    });

    new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: helloWithCounter.handler
    });

    new TableViewer(this, 'ViewHitCounter', {
      title: 'Hello Hits',
      table: helloWithCounter.table
    });

    const datadog = new Datadog(this, 'Datadog', {
      nodeLayerVersion: 81,
      extensionLayerVersion: 28,
      apiKey: props.datadogApiKey
    });
    datadog.addLambdaFunctions([hello]);
  }
}
