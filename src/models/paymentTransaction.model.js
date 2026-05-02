import { Model, DataTypes } from 'sequelize';

export default class PaymentTransaction extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        userId: {
          type: DataTypes.BIGINT,
          allowNull: true,
          field: 'user_id',
        },
        provider: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'razorpay',
        },
        planCode: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'plan_code',
        },
        razorpayOrderId: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'razorpay_order_id',
        },
        razorpayPaymentId: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'razorpay_payment_id',
        },
        receipt: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        amountPaise: {
          type: DataTypes.BIGINT,
          allowNull: true,
          field: 'amount_paise',
        },
        currency: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        source: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        eventType: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'event_type',
        },
        verificationMethod: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'verification_method',
        },
        rawPayload: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'raw_payload',
        },
        metadata: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'created_at',
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'updated_at',
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'payment_transactions',
        timestamps: false,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  }
}
