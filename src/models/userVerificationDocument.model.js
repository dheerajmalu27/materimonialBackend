import { DataTypes, Model } from 'sequelize';

export default class UserVerificationDocument extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        userId: { type: DataTypes.BIGINT, field: 'user_id', allowNull: false },
        docType: { type: DataTypes.ENUM('aadhaar', 'photo', 'income'), field: 'doc_type', allowNull: false },
        fileUrl: { type: DataTypes.STRING, field: 'file_url', allowNull: false },
        status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
        uploadedAt: { type: DataTypes.DATE, field: 'uploaded_at', allowNull: false },
        reviewedAt: { type: DataTypes.DATE, field: 'reviewed_at', allowNull: true },
      },
      {
        sequelize,
        tableName: 'user_verification_documents',
        timestamps: false,
        underscored: true,
      },
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  }
}

