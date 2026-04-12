import { DataTypes, Model } from 'sequelize';

export default class UserProfile extends Model {
  static init(sequelize) {
    return super.init(
      {
        userId: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          field: 'user_id'
        },
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        dob: DataTypes.DATEONLY,
        birthTime: {
          type: DataTypes.TIME,
          field: 'birth_time'
        },
        heightCm: {
          type: DataTypes.INTEGER,
          field: 'height_cm'
        },
        weightKg: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'weight_kg'
        },
        maritalStatus: DataTypes.STRING,
        religion: DataTypes.STRING,
        caste: DataTypes.STRING,
        motherTongue: {
          type: DataTypes.STRING,
          field: 'mother_tongue'
        },
        aboutMe: {
          type: DataTypes.TEXT,
          field: 'about_me'
        },
        occupation: DataTypes.STRING,
        location: DataTypes.STRING,
        education: DataTypes.STRING,
        income: DataTypes.STRING,
        phone: DataTypes.STRING,
        profileImage: {
          type: DataTypes.STRING,
          field: 'profile_image'
        },
        profileImages: {
          type: DataTypes.TEXT,
          field: 'profile_images',
          // store array as JSON string in DB
          get() {
            const raw = this.getDataValue('profileImages');
            if (!raw) return [];
            try {
              return JSON.parse(raw);
            } catch (e) {
              return [];
            }
          },
          set(val) {
            // accepts array or JSON string
            if (Array.isArray(val)) {
              this.setDataValue('profileImages', JSON.stringify(val));
            } else {
              this.setDataValue('profileImages', val);
            }
          }
        },
        biodataPdf: {
          type: DataTypes.STRING,
          field: 'biodata_pdf',
          allowNull: true
        },
        isOnline: {
          type: DataTypes.BOOLEAN,
          field: 'is_online',
          defaultValue: false
        },
      },
      {
        sequelize,
        tableName: 'user_profiles',
        timestamps: false,
        underscored: true
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id' });
  }
}
