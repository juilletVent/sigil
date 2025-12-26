#[cfg(test)]
mod tests {
    use crate::db::{Database, CreateCommandInput};
    use rusqlite::Connection;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn create_test_database() -> Database {
        // 创建临时目录用于测试，使用时间戳确保每个测试使用独立的数据库
        let temp_dir = std::env::temp_dir().join("sigil_test_db");
        std::fs::create_dir_all(&temp_dir).unwrap();
        
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let db_path = temp_dir.join(format!("test_{}.db", timestamp));
        let conn = Connection::open(&db_path).unwrap();
        
        // 创建表
        Database::create_tables(&conn).unwrap();
        
        // 使用测试辅助函数创建数据库实例
        Database::new_for_testing(conn)
    }

    #[test]
    fn test_create_command() {
        let db = create_test_database();
        
        let input = CreateCommandInput {
            name: "测试命令".to_string(),
            command: "echo test".to_string(),
            sudo: false,
            working_directory: None,
            url: None,
            notification_when_finished: false,
        };
        
        let result = db.create_command(input);
        assert!(result.is_ok());
        
        let command = result.unwrap();
        assert_eq!(command.name, "测试命令");
        assert_eq!(command.command, "echo test");
    }

    #[test]
    fn test_get_all_commands() {
        let db = create_test_database();
        
        // 创建几个命令
        for i in 0..3 {
            let input = CreateCommandInput {
                name: format!("命令{}", i),
                command: format!("echo {}", i),
                sudo: false,
                working_directory: None,
                url: None,
                notification_when_finished: false,
            };
            db.create_command(input).unwrap();
        }
        
        let commands = db.get_all_commands().unwrap();
        assert_eq!(commands.len(), 3);
    }

    #[test]
    fn test_get_command_by_id() {
        let db = create_test_database();
        
        let input = CreateCommandInput {
            name: "测试命令".to_string(),
            command: "echo test".to_string(),
            sudo: false,
            working_directory: None,
            url: None,
            notification_when_finished: false,
        };
        
        let created = db.create_command(input).unwrap();
        let retrieved = db.get_command_by_id(created.id).unwrap();
        
        assert_eq!(created.id, retrieved.id);
        assert_eq!(created.name, retrieved.name);
    }

    #[test]
    fn test_update_command() {
        let db = create_test_database();
        
        let input = CreateCommandInput {
            name: "原始名称".to_string(),
            command: "echo original".to_string(),
            sudo: false,
            working_directory: None,
            url: None,
            notification_when_finished: false,
        };
        
        let created = db.create_command(input).unwrap();
        
        let update_input = crate::db::UpdateCommandInput {
            name: Some("新名称".to_string()),
            command: None,
            sudo: None,
            working_directory: None,
            url: None,
            notification_when_finished: None,
        };
        
        db.update_command(created.id, update_input).unwrap();
        
        let updated = db.get_command_by_id(created.id).unwrap();
        assert_eq!(updated.name, "新名称");
        assert_eq!(updated.command, "echo original"); // 未更新的字段保持不变
    }

    #[test]
    fn test_delete_command() {
        let db = create_test_database();
        
        let input = CreateCommandInput {
            name: "待删除命令".to_string(),
            command: "echo delete".to_string(),
            sudo: false,
            working_directory: None,
            url: None,
            notification_when_finished: false,
        };
        
        let created = db.create_command(input).unwrap();
        db.delete_command(created.id).unwrap();
        
        let result = db.get_command_by_id(created.id);
        assert!(result.is_err());
    }

    #[test]
    fn test_config_operations() {
        let db = create_test_database();
        
        // 测试设置和获取配置
        db.set_config("test_key", "test_value").unwrap();
        let value = db.get_config("test_key").unwrap();
        assert_eq!(value, Some("test_value".to_string()));
        
        // 测试更新配置
        db.set_config("test_key", "new_value").unwrap();
        let value = db.get_config("test_key").unwrap();
        assert_eq!(value, Some("new_value".to_string()));
    }
}

