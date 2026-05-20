import { DataTypes, Model } from 'sequelize';

export default class UserSubscription extends Model {
  static init(sequelize) {
    return super.init(
      {
        userId: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          field: 'user_id',
        },
        planId: {
          type: DataTypes.BIGINT,
          field: 'plan_id',
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM('active', 'paused', 'canceled', 'expired'),
          allowNull: false,
          defaultValue: 'active',
        },
        startedAt: {
          type: DataTypes.DATE,
          field: 'started_at',
          allowNull: false,
        },
        currentPeriodStart: {
          type: DataTypes.DATE,
          field: 'current_period_start',
          allowNull: false,
        },
        currentPeriodEnd: {
          type: DataTypes.DATE,
          field: 'current_period_end',
          allowNull: false,
        },
        canceledAt: {
          type: DataTypes.DATE,
          field: 'canceled_at',
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'user_subscriptions',
        timestamps: false,
        underscored: true,
      },
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    this.belongsTo(models.SubscriptionPlan, { foreignKey: 'plan_id', as: 'plan' });
  }
}

