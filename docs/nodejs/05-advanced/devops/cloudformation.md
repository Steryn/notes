# CloudFormation

## 📋 概述

AWS CloudFormation是亚马逊提供的基础设施即代码服务，允许使用JSON或YAML模板来定义和部署AWS资源。它提供了声明式的方式来管理整个AWS基础设施栈。

## 🎯 学习目标

- 掌握CloudFormation的核心概念和架构
- 学会编写和组织CloudFormation模板
- 了解栈管理和更新策略
- 掌握Node.js应用的AWS基础设施部署

## 📚 CloudFormation核心概念

### 模板结构

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Node.js应用基础设施模板'

# 输入参数
Parameters:
  Environment:
    Type: String
    Default: 'dev'
    AllowedValues: ['dev', 'staging', 'prod']

# 映射关系
Mappings:
  EnvironmentMap:
    dev:
      InstanceType: t3.micro
      MinSize: 1
      MaxSize: 2
    prod:
      InstanceType: t3.medium
      MinSize: 2
      MaxSize: 10

# 条件判断
Conditions:
  IsProd: !Equals [!Ref Environment, 'prod']
  CreateReadReplica: !Equals [!Ref Environment, 'prod']

# 资源定义
Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16

# 输出值
Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'
```

### 内置函数

```yaml
# 常用内置函数示例
Resources:
  Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: !FindInMap [EnvironmentMap, !Ref Environment, InstanceType]
      SubnetId: !Ref PublicSubnet
      SecurityGroupIds:
        - !Ref WebSecurityGroup
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          echo "Environment: ${Environment}" > /tmp/env.txt
          echo "Stack: ${AWS::StackName}" >> /tmp/env.txt
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-web-server'
        - Key: Environment
          Value: !Ref Environment
```

## 🛠 Node.js应用完整基础设施

### 主模板

```yaml
# main-template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Complete Node.js Application Infrastructure'

Parameters:
  Environment:
    Type: String
    Default: 'dev'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment name'
  
  ProjectName:
    Type: String
    Default: 'nodejs-app'
    Description: 'Project name for resource naming'
  
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access'
  
  DBPassword:
    Type: String
    NoEcho: true
    MinLength: 8
    Description: 'Database password'
  
  SSLCertificateArn:
    Type: String
    Default: ''
    Description: 'SSL Certificate ARN (optional)'
  
  DomainName:
    Type: String
    Default: ''
    Description: 'Domain name (optional)'

Mappings:
  EnvironmentMap:
    dev:
      InstanceType: t3.micro
      DBInstanceClass: db.t3.micro
      MinSize: 1
      MaxSize: 2
      DesiredCapacity: 1
      AllocatedStorage: 20
    staging:
      InstanceType: t3.small
      DBInstanceClass: db.t3.small
      MinSize: 1
      MaxSize: 3
      DesiredCapacity: 2
      AllocatedStorage: 50
    prod:
      InstanceType: t3.medium
      DBInstanceClass: db.t3.medium
      MinSize: 2
      MaxSize: 10
      DesiredCapacity: 3
      AllocatedStorage: 100

Conditions:
  IsProd: !Equals [!Ref Environment, 'prod']
  HasSSLCertificate: !Not [!Equals [!Ref SSLCertificateArn, '']]
  HasDomainName: !Not [!Equals [!Ref DomainName, '']]
  CreateReadReplica: !Equals [!Ref Environment, 'prod']

Resources:
  # VPC网络
  VPCStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: './nested-templates/vpc.yaml'
      Parameters:
        Environment: !Ref Environment
        ProjectName: !Ref ProjectName

  # 安全组
  SecurityStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: './nested-templates/security-groups.yaml'
      Parameters:
        Environment: !Ref Environment
        ProjectName: !Ref ProjectName
        VPCId: !GetAtt VPCStack.Outputs.VPCId

  # 数据库
  DatabaseStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: './nested-templates/database.yaml'
      Parameters:
        Environment: !Ref Environment
        ProjectName: !Ref ProjectName
        VPCId: !GetAtt VPCStack.Outputs.VPCId
        PrivateSubnet1: !GetAtt VPCStack.Outputs.PrivateSubnet1
        PrivateSubnet2: !GetAtt VPCStack.Outputs.PrivateSubnet2
        DatabaseSecurityGroup: !GetAtt SecurityStack.Outputs.DatabaseSecurityGroup
        DBInstanceClass: !FindInMap [EnvironmentMap, !Ref Environment, DBInstanceClass]
        AllocatedStorage: !FindInMap [EnvironmentMap, !Ref Environment, AllocatedStorage]
        DBPassword: !Ref DBPassword

  # 缓存
  CacheStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: './nested-templates/cache.yaml'
      Parameters:
        Environment: !Ref Environment
        ProjectName: !Ref ProjectName
        VPCId: !GetAtt VPCStack.Outputs.VPCId
        PrivateSubnet1: !GetAtt VPCStack.Outputs.PrivateSubnet1
        PrivateSubnet2: !GetAtt VPCStack.Outputs.PrivateSubnet2
        CacheSecurityGroup: !GetAtt SecurityStack.Outputs.CacheSecurityGroup

  # 应用服务器
  ApplicationStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: './nested-templates/application.yaml'
      Parameters:
        Environment: !Ref Environment
        ProjectName: !Ref ProjectName
        VPCId: !GetAtt VPCStack.Outputs.VPCId
        PublicSubnet1: !GetAtt VPCStack.Outputs.PublicSubnet1
        PublicSubnet2: !GetAtt VPCStack.Outputs.PublicSubnet2
        PrivateSubnet1: !GetAtt VPCStack.Outputs.PrivateSubnet1
        PrivateSubnet2: !GetAtt VPCStack.Outputs.PrivateSubnet2
        WebSecurityGroup: !GetAtt SecurityStack.Outputs.WebSecurityGroup
        ALBSecurityGroup: !GetAtt SecurityStack.Outputs.ALBSecurityGroup
        InstanceType: !FindInMap [EnvironmentMap, !Ref Environment, InstanceType]
        MinSize: !FindInMap [EnvironmentMap, !Ref Environment, MinSize]
        MaxSize: !FindInMap [EnvironmentMap, !Ref Environment, MaxSize]
        DesiredCapacity: !FindInMap [EnvironmentMap, !Ref Environment, DesiredCapacity]
        KeyPairName: !Ref KeyPairName
        DatabaseEndpoint: !GetAtt DatabaseStack.Outputs.DatabaseEndpoint
        CacheEndpoint: !GetAtt CacheStack.Outputs.CacheEndpoint
        SSLCertificateArn: !Ref SSLCertificateArn

  # 监控
  MonitoringStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: './nested-templates/monitoring.yaml'
      Parameters:
        Environment: !Ref Environment
        ProjectName: !Ref ProjectName
        LoadBalancerFullName: !GetAtt ApplicationStack.Outputs.LoadBalancerFullName
        AutoScalingGroupName: !GetAtt ApplicationStack.Outputs.AutoScalingGroupName

Outputs:
  LoadBalancerDNS:
    Description: 'Load Balancer DNS Name'
    Value: !GetAtt ApplicationStack.Outputs.LoadBalancerDNS
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancer-DNS'

  DatabaseEndpoint:
    Description: 'Database Endpoint'
    Value: !GetAtt DatabaseStack.Outputs.DatabaseEndpoint
    Export:
      Name: !Sub '${AWS::StackName}-Database-Endpoint'

  VPCId:
    Description: 'VPC ID'
    Value: !GetAtt VPCStack.Outputs.VPCId
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'
```

### VPC嵌套模板

```yaml
# nested-templates/vpc.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'VPC and Networking Resources'

Parameters:
  Environment:
    Type: String
  ProjectName:
    Type: String

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc'
        - Key: Environment
          Value: !Ref Environment

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-igw'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-2'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.3.0/24
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.4.0/24
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-2'

  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-eip-1'

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-eip-2'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-1'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-2'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-routes'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-routes-1'

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-routes-2'

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC

  PublicSubnet1:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1

  PublicSubnet2:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2

  PrivateSubnet1:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1

  PrivateSubnet2:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
```

### 应用服务器嵌套模板

```yaml
# nested-templates/application.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Application Servers and Load Balancer'

Parameters:
  Environment:
    Type: String
  ProjectName:
    Type: String
  VPCId:
    Type: String
  PublicSubnet1:
    Type: String
  PublicSubnet2:
    Type: String
  PrivateSubnet1:
    Type: String
  PrivateSubnet2:
    Type: String
  WebSecurityGroup:
    Type: String
  ALBSecurityGroup:
    Type: String
  InstanceType:
    Type: String
  MinSize:
    Type: Number
  MaxSize:
    Type: Number
  DesiredCapacity:
    Type: Number
  KeyPairName:
    Type: String
  DatabaseEndpoint:
    Type: String
  CacheEndpoint:
    Type: String
  SSLCertificateArn:
    Type: String

Conditions:
  HasSSLCertificate: !Not [!Equals [!Ref SSLCertificateArn, '']]

Resources:
  # IAM角色
  InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-instance-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${S3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref S3Bucket
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref ApplicationSecrets

  InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-${Environment}-instance-profile'
      Roles:
        - !Ref InstanceRole

  # S3存储桶
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-app-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-app-bucket'
        - Key: Environment
          Value: !Ref Environment

  # Secrets Manager
  ApplicationSecrets:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-app-secrets'
      Description: 'Application secrets'
      SecretString: !Sub |
        {
          "DATABASE_URL": "postgresql://postgres:${DBPassword}@${DatabaseEndpoint}:5432/nodejs_app",
          "REDIS_URL": "redis://${CacheEndpoint}:6379",
          "JWT_SECRET": "${JWTSecret}",
          "SESSION_SECRET": "${SessionSecret}"
        }
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-secrets'
        - Key: Environment
          Value: !Ref Environment

  # 启动模板
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-${Environment}-launch-template'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyPairName
        SecurityGroupIds:
          - !Ref WebSecurityGroup
        IamInstanceProfile:
          Arn: !GetAtt InstanceProfile.Arn
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y docker amazon-cloudwatch-agent
            
            # 启动Docker
            systemctl start docker
            systemctl enable docker
            usermod -a -G docker ec2-user
            
            # 安装Node.js
            curl -sL https://rpm.nodesource.com/setup_18.x | bash -
            yum install -y nodejs
            
            # 创建应用目录
            mkdir -p /opt/nodejs-app
            cd /opt/nodejs-app
            
            # 从S3下载应用代码
            aws s3 cp s3://${S3Bucket}/app.tar.gz /tmp/app.tar.gz
            tar -xzf /tmp/app.tar.gz -C /opt/nodejs-app
            
            # 获取应用密钥
            aws secretsmanager get-secret-value \
              --secret-id ${ApplicationSecrets} \
              --region ${AWS::Region} \
              --query SecretString --output text > /opt/nodejs-app/.env
            
            # 安装依赖
            npm ci --only=production
            
            # 创建systemd服务
            cat << EOF > /etc/systemd/system/nodejs-app.service
            [Unit]
            Description=Node.js Application
            After=network.target
            
            [Service]
            Type=simple
            User=ec2-user
            WorkingDirectory=/opt/nodejs-app
            EnvironmentFile=/opt/nodejs-app/.env
            ExecStart=/usr/bin/node server.js
            Restart=always
            RestartSec=5
            
            [Install]
            WantedBy=multi-user.target
            EOF
            
            # 启动应用
            systemctl daemon-reload
            systemctl enable nodejs-app
            systemctl start nodejs-app
            
            # 配置CloudWatch Agent
            cat << EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/nodejs-app.log",
                        "log_group_name": "/aws/ec2/${ProjectName}-${Environment}",
                        "log_stream_name": "{instance_id}"
                      }
                    ]
                  }
                }
              },
              "metrics": {
                "namespace": "NodeJS/Application",
                "metrics_collected": {
                  "cpu": {
                    "measurement": ["cpu_usage_idle", "cpu_usage_iowait"]
                  },
                  "disk": {
                    "measurement": ["used_percent"],
                    "metrics_collection_interval": 60,
                    "resources": ["*"]
                  },
                  "mem": {
                    "measurement": ["mem_used_percent"]
                  }
                }
              }
            }
            EOF
            
            # 启动CloudWatch Agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config \
              -m ec2 \
              -s \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-${Environment}-instance'
              - Key: Environment
                Value: !Ref Environment

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-${Environment}-asg'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-asg'
          PropagateAtLaunch: false
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 2
        PauseTime: PT5M
        WaitOnResourceSignals: true
        SuspendProcesses:
          - HealthCheck
          - ReplaceUnhealthy
          - AZRebalance
          - AlarmNotification
          - ScheduledActions

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-alb'
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-alb'
        - Key: Environment
          Value: !Ref Environment

  # Target Group
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-tg'
      Port: 3000
      Protocol: HTTP
      VpcId: !Ref VPCId
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-tg'
        - Key: Environment
          Value: !Ref Environment

  # HTTP Listener
  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # HTTPS Listener (条件性创建)
  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: HasSSLCertificate
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref SSLCertificateArn

  # Auto Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1

  # CloudWatch Alarms
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-cpu-high'
      AlarmDescription: 'CPU utilization is too high'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleUpPolicy

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-cpu-low'
      AlarmDescription: 'CPU utilization is too low'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 20
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy

  # CloudWatch Log Group
  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${ProjectName}-${Environment}'
      RetentionInDays: 30

Parameters:
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2

  DBPassword:
    Type: String
    NoEcho: true

  JWTSecret:
    Type: String
    Default: !Sub '${AWS::StackName}-jwt-secret-${AWS::AccountId}'
    NoEcho: true

  SessionSecret:
    Type: String
    Default: !Sub '${AWS::StackName}-session-secret-${AWS::AccountId}'
    NoEcho: true

Outputs:
  LoadBalancerDNS:
    Description: 'Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName

  LoadBalancerFullName:
    Description: 'Load Balancer Full Name'
    Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName

  AutoScalingGroupName:
    Description: 'Auto Scaling Group Name'
    Value: !Ref AutoScalingGroup

  S3BucketName:
    Description: 'S3 Bucket Name'
    Value: !Ref S3Bucket
```

## 🚀 部署和管理

### 部署脚本

```bash
#!/bin/bash
# deploy-cloudformation.sh

set -e

# 配置变量
STACK_NAME=${1:-"nodejs-app-dev"}
ENVIRONMENT=${2:-"dev"}
TEMPLATE_FILE=${3:-"main-template.yaml"}
PARAMETERS_FILE=${4:-"parameters-${ENVIRONMENT}.json"}

echo "🚀 部署CloudFormation栈: $STACK_NAME"
echo "环境: $ENVIRONMENT"
echo "模板: $TEMPLATE_FILE"
echo "参数: $PARAMETERS_FILE"

# 验证模板
echo "🔍 验证CloudFormation模板..."
aws cloudformation validate-template --template-body file://$TEMPLATE_FILE

# 检查栈是否存在
if aws cloudformation describe-stacks --stack-name $STACK_NAME > /dev/null 2>&1; then
    echo "📝 更新现有栈..."
    
    # 创建变更集
    CHANGE_SET_NAME="changeset-$(date +%Y%m%d-%H%M%S)"
    
    aws cloudformation create-change-set \
        --stack-name $STACK_NAME \
        --change-set-name $CHANGE_SET_NAME \
        --template-body file://$TEMPLATE_FILE \
        --parameters file://$PARAMETERS_FILE \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
    
    echo "⏳ 等待变更集创建完成..."
    aws cloudformation wait change-set-create-complete \
        --stack-name $STACK_NAME \
        --change-set-name $CHANGE_SET_NAME
    
    # 显示变更
    echo "📋 变更预览:"
    aws cloudformation describe-change-set \
        --stack-name $STACK_NAME \
        --change-set-name $CHANGE_SET_NAME \
        --query 'Changes[].{Action:Action,ResourceType:ResourceChange.ResourceType,LogicalId:ResourceChange.LogicalResourceId}' \
        --output table
    
    # 确认执行
    read -p "确认执行变更？(y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        aws cloudformation execute-change-set \
            --stack-name $STACK_NAME \
            --change-set-name $CHANGE_SET_NAME
        
        echo "⏳ 等待栈更新完成..."
        aws cloudformation wait stack-update-complete --stack-name $STACK_NAME
    else
        echo "取消变更"
        aws cloudformation delete-change-set \
            --stack-name $STACK_NAME \
            --change-set-name $CHANGE_SET_NAME
        exit 0
    fi
else
    echo "🆕 创建新栈..."
    aws cloudformation create-stack \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --parameters file://$PARAMETERS_FILE \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
        --on-failure ROLLBACK
    
    echo "⏳ 等待栈创建完成..."
    aws cloudformation wait stack-create-complete --stack-name $STACK_NAME
fi

# 显示输出
echo "📊 栈输出:"
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs' \
    --output table

echo "✅ 部署完成!"
```

### 参数文件示例

```json
// parameters-dev.json
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "dev"
  },
  {
    "ParameterKey": "ProjectName",
    "ParameterValue": "nodejs-app"
  },
  {
    "ParameterKey": "KeyPairName",
    "ParameterValue": "my-key-pair"
  },
  {
    "ParameterKey": "DBPassword",
    "ParameterValue": "MySecurePassword123!"
  },
  {
    "ParameterKey": "SSLCertificateArn",
    "ParameterValue": ""
  },
  {
    "ParameterKey": "DomainName",
    "ParameterValue": ""
  }
]
```

```json
// parameters-prod.json
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "prod"
  },
  {
    "ParameterKey": "ProjectName",
    "ParameterValue": "nodejs-app"
  },
  {
    "ParameterKey": "KeyPairName",
    "ParameterValue": "prod-key-pair"
  },
  {
    "ParameterKey": "DBPassword",
    "ParameterValue": "ProductionSecurePassword123!"
  },
  {
    "ParameterKey": "SSLCertificateArn",
    "ParameterValue": "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"
  },
  {
    "ParameterKey": "DomainName",
    "ParameterValue": "api.example.com"
  }
]
```

## 🔧 高级功能

### 自定义资源

```yaml
# Custom Resource for Application Deployment
ApplicationDeployment:
  Type: AWS::CloudFormation::CustomResource
  Properties:
    ServiceToken: !GetAtt DeploymentFunction.Arn
    S3Bucket: !Ref S3Bucket
    ApplicationVersion: !Ref ApplicationVersion
    Environment: !Ref Environment

DeploymentFunction:
  Type: AWS::Lambda::Function
  Properties:
    FunctionName: !Sub '${ProjectName}-${Environment}-deployment'
    Runtime: python3.9
    Handler: index.handler
    Role: !GetAtt DeploymentFunctionRole.Arn
    Code:
      ZipFile: |
        import boto3
        import cfnresponse
        import json
        
        def handler(event, context):
            try:
                s3 = boto3.client('s3')
                
                if event['RequestType'] == 'Create' or event['RequestType'] == 'Update':
                    # 下载并部署应用
                    bucket = event['ResourceProperties']['S3Bucket']
                    version = event['ResourceProperties']['ApplicationVersion']
                    
                    # 部署逻辑
                    print(f"Deploying version {version} to {bucket}")
                    
                    cfnresponse.send(event, context, cfnresponse.SUCCESS, {
                        'DeploymentId': f"deploy-{version}",
                        'Status': 'Deployed'
                    })
                    
                elif event['RequestType'] == 'Delete':
                    # 清理逻辑
                    cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
                    
            except Exception as e:
                print(f"Error: {str(e)}")
                cfnresponse.send(event, context, cfnresponse.FAILED, {})

DeploymentFunctionRole:
  Type: AWS::IAM::Role
  Properties:
    AssumeRolePolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal:
            Service: lambda.amazonaws.com
          Action: sts:AssumeRole
    ManagedPolicyArns:
      - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    Policies:
      - PolicyName: S3Access
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - s3:GetObject
                - s3:PutObject
              Resource: !Sub '${S3Bucket}/*'
```

### 栈间依赖

```yaml
# 使用跨栈引用
DatabaseEndpoint:
  Type: String
  Default: !ImportValue 
    Fn::Sub: '${DatabaseStackName}-Database-Endpoint'

# 或使用嵌套栈输出
DatabaseEndpoint: !GetAtt DatabaseStack.Outputs.DatabaseEndpoint
```

## 📊 监控和日志

### CloudWatch集成

```yaml
# CloudWatch Dashboard
CloudWatchDashboard:
  Type: AWS::CloudWatch::Dashboard
  Properties:
    DashboardName: !Sub '${ProjectName}-${Environment}-dashboard'
    DashboardBody: !Sub |
      {
        "widgets": [
          {
            "type": "metric",
            "properties": {
              "metrics": [
                ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "${ApplicationLoadBalancer.LoadBalancerFullName}"],
                ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "${ApplicationLoadBalancer.LoadBalancerFullName}"],
                ["AWS/ApplicationELB", "HTTPCode_Target_4XX_Count", "LoadBalancer", "${ApplicationLoadBalancer.LoadBalancerFullName}"],
                ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", "${ApplicationLoadBalancer.LoadBalancerFullName}"]
              ],
              "period": 300,
              "stat": "Sum",
              "region": "${AWS::Region}",
              "title": "ALB Metrics"
            }
          },
          {
            "type": "metric",
            "properties": {
              "metrics": [
                ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", "${AutoScalingGroup}"],
                ["AWS/EC2", "NetworkIn", "AutoScalingGroupName", "${AutoScalingGroup}"],
                ["AWS/EC2", "NetworkOut", "AutoScalingGroupName", "${AutoScalingGroup}"]
              ],
              "period": 300,
              "stat": "Average",
              "region": "${AWS::Region}",
              "title": "EC2 Metrics"
            }
          }
        ]
      }
```

## 📝 总结

AWS CloudFormation为Node.js应用提供了强大的基础设施管理能力：

- **声明式配置**：清晰描述AWS资源和依赖关系
- **版本控制**：基础设施代码可以版本化管理
- **回滚能力**：自动回滚失败的部署
- **嵌套栈**：模块化和可重用的模板设计
- **AWS集成**：与AWS服务深度集成

通过合理的模板设计和参数化配置，可以实现高效、可维护的AWS基础设施管理。

## 🔗 相关资源

- [CloudFormation用户指南](https://docs.aws.amazon.com/cloudformation/)
- [CloudFormation模板参考](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-reference.html)
- [AWS CLI CloudFormation命令](https://docs.aws.amazon.com/cli/latest/reference/cloudformation/)
- [CloudFormation最佳实践](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/best-practices.html)
