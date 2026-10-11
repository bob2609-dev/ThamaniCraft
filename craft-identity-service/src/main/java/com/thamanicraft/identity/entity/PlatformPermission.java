package com.thamanicraft.identity.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "platform_permissions")
public class PlatformPermission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;
    
    @Column(name = "domain_group")
    private String domainGroup;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDomainGroup() { return domainGroup; }
    public void setDomainGroup(String domainGroup) { this.domainGroup = domainGroup; }
}
